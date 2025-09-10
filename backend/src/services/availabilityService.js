const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AvailabilityService {
  // Get healer's availability for a specific day of week
  async getHealerAvailability(healerId, dayOfWeek) {
    return await prisma.healerAvailability.findUnique({
      where: {
        healerId_dayOfWeek: {
          healerId,
          dayOfWeek
        }
      }
    });
  }

  // Get all availability for a healer
  async getAllHealerAvailability(healerId) {
    return await prisma.healerAvailability.findMany({
      where: { healerId },
      orderBy: { dayOfWeek: 'asc' }
    });
  }

  // Update or create availability for a healer
  async updateHealerAvailability(healerId, availabilityData) {
    const { dayOfWeek, isAvailable, startTime, endTime, breakStartTime, breakEndTime } = availabilityData;
    
    return await prisma.healerAvailability.upsert({
      where: {
        healerId_dayOfWeek: {
          healerId,
          dayOfWeek
        }
      },
      update: {
        isAvailable,
        startTime,
        endTime,
        breakStartTime,
        breakEndTime,
        updatedAt: new Date()
      },
      create: {
        healerId,
        dayOfWeek,
        isAvailable,
        startTime,
        endTime,
        breakStartTime,
        breakEndTime
      }
    });
  }

  // Get available time slots for a healer on a specific date
  async getAvailableSlots(healerId, date, duration) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    
    // Get healer's availability for this day
    const availability = await this.getHealerAvailability(healerId, dayOfWeek);
    
    if (!availability || !availability.isAvailable) {
      return [];
    }

    // Get existing bookings for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        healerId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      select: {
        scheduledAt: true,
        duration: true
      }
    });

    // Generate time slots based on availability
    const slots = [];
    const startTime = this.parseTime(availability.startTime);
    const endTime = this.parseTime(availability.endTime);
    const breakStartTime = availability.breakStartTime ? this.parseTime(availability.breakStartTime) : null;
    const breakEndTime = availability.breakEndTime ? this.parseTime(availability.breakEndTime) : null;

    // Create 30-minute slots (or based on service duration)
    const slotDuration = 30; // minutes
    let currentTime = startTime;

    while (currentTime < endTime) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // Skip if slot extends beyond work hours
      const slotEndTime = slotEnd.getHours() * 60 + slotEnd.getMinutes();
      if (slotEndTime > endTime) {
        break;
      }

      // Skip if slot conflicts with break time
      if (breakStartTime && breakEndTime) {
        const slotStartTime = currentTime;
        if (!(slotEndTime <= breakStartTime || slotStartTime >= breakEndTime)) {
          currentTime += slotDuration;
          continue;
        }
      }

      // Check if slot conflicts with existing bookings
      const isBooked = existingBookings.some(booking => {
        const bookingStart = new Date(booking.scheduledAt);
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
        
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });

      if (!isBooked) {
        slots.push({
          time: slotStart.toISOString(),
          available: true,
          duration: duration
        });
      }

      currentTime += slotDuration;
    }

    return slots;
  }

  // Parse time string (HH:MM:SS) to minutes since midnight
  parseTime(timeString) {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Format minutes since midnight to time string
  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  // Check if a specific time slot is available
  async isSlotAvailable(healerId, scheduledAt, duration) {
    const date = new Date(scheduledAt);
    const dayOfWeek = date.getDay();
    
    // Check healer availability for this day
    const availability = await this.getHealerAvailability(healerId, dayOfWeek);
    if (!availability || !availability.isAvailable) {
      return false;
    }

    // Check if time is within working hours
    const slotTime = date.getHours() * 60 + date.getMinutes();
    const startTime = this.parseTime(availability.startTime);
    const endTime = this.parseTime(availability.endTime);
    const slotEndTime = slotTime + duration;

    if (slotTime < startTime || slotEndTime > endTime) {
      return false;
    }

    // Check break time conflict
    if (availability.breakStartTime && availability.breakEndTime) {
      const breakStart = this.parseTime(availability.breakStartTime);
      const breakEnd = this.parseTime(availability.breakEndTime);
      
      if (!(slotEndTime <= breakStart || slotTime >= breakEnd)) {
        return false;
      }
    }

    // Check for booking conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        healerId,
        scheduledAt: {
          gte: new Date(date.getTime() - duration * 60000), // Start checking from duration before
          lte: new Date(date.getTime() + duration * 60000)   // End checking at duration after
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    return !conflictingBooking;
  }

  // Set default availability for new healers (Monday-Friday 9AM-5PM)
  async createDefaultAvailability(healerId) {
    const defaultSchedule = [
      { dayOfWeek: 1, isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', breakStartTime: '12:00:00', breakEndTime: '13:00:00' }, // Monday
      { dayOfWeek: 2, isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', breakStartTime: '12:00:00', breakEndTime: '13:00:00' }, // Tuesday
      { dayOfWeek: 3, isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', breakStartTime: '12:00:00', breakEndTime: '13:00:00' }, // Wednesday
      { dayOfWeek: 4, isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', breakStartTime: '12:00:00', breakEndTime: '13:00:00' }, // Thursday
      { dayOfWeek: 5, isAvailable: true, startTime: '09:00:00', endTime: '17:00:00', breakStartTime: '12:00:00', breakEndTime: '13:00:00' }, // Friday
      { dayOfWeek: 6, isAvailable: false, startTime: '09:00:00', endTime: '17:00:00' }, // Saturday
      { dayOfWeek: 0, isAvailable: false, startTime: '09:00:00', endTime: '17:00:00' }  // Sunday
    ];

    const promises = defaultSchedule.map(schedule => 
      prisma.healerAvailability.upsert({
        where: {
          healerId_dayOfWeek: {
            healerId,
            dayOfWeek: schedule.dayOfWeek
          }
        },
        update: {},
        create: {
          healerId,
          ...schedule
        }
      })
    );

    return await Promise.all(promises);
  }
}

module.exports = new AvailabilityService();