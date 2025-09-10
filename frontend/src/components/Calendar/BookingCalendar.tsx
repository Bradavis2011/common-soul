import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { format, addDays, isSameDay, isToday, isPast } from "date-fns";
import apiService from "@/services/api";

interface TimeSlot {
  time: string;
  available: boolean;
  bookingId?: string;
}

interface BookingCalendarProps {
  healerId: string;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  duration: number;
  onAvailabilityChange?: (hasAvailableSlots: boolean) => void;
}

const BookingCalendar = ({
  healerId,
  selectedDate,
  onDateSelect,
  selectedTime,
  onTimeSelect,
  duration,
  onAvailabilityChange
}: BookingCalendarProps) => {
  const [availableSlots, setAvailableSlots] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(false);
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Generate time slots from 8 AM to 8 PM in 30-minute intervals
  const generateTimeSlots = (): string[] => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute > 0) break; // Stop at 8:00 PM
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
        slots.push(time12);
      }
    }
    return slots;
  };

  // Load availability for a specific date range
  const loadAvailability = async (startDate: Date, endDate: Date) => {
    if (!healerId) return;
    
    setLoading(true);
    try {
      const response = await apiService.getHealerAvailability(healerId, startDate, endDate);
      
      if (response.success && response.data) {
        const availability: Record<string, TimeSlot[]> = {};
        
        // For each day in the range, create time slots
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateKey = format(currentDate, 'yyyy-MM-dd');
          const allSlots = generateTimeSlots();
          
          availability[dateKey] = allSlots.map(time => ({
            time,
            available: !isPast(currentDate) && isSlotAvailable(currentDate, time, response.data.bookings, response.data.availability),
            bookingId: getBookingForSlot(currentDate, time, response.data.bookings)
          }));
          
          currentDate = addDays(currentDate, 1);
        }
        
        setAvailableSlots(availability);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if a time slot is available based on healer's schedule and existing bookings
  const isSlotAvailable = (date: Date, timeSlot: string, bookings: any[], healerAvailability: any[]): boolean => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const [time, period] = timeSlot.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hour24, minutes, 0, 0);
    
    // Check if healer is available on this day/time
    const dayAvailability = healerAvailability.find(av => av.dayOfWeek === dayOfWeek);
    if (!dayAvailability || !dayAvailability.isAvailable) return false;
    
    const startTime = dayAvailability.startTime;
    const endTime = dayAvailability.endTime;
    const slotTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    if (slotTime < startTime || slotTime >= endTime) return false;
    
    // Check for conflicting bookings
    const hasConflict = bookings.some(booking => {
      const bookingStart = new Date(booking.scheduledAt);
      const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
      const slotEnd = new Date(slotDateTime.getTime() + duration * 60000);
      
      return (
        (slotDateTime >= bookingStart && slotDateTime < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotDateTime <= bookingStart && slotEnd >= bookingEnd)
      );
    });
    
    return !hasConflict;
  };

  // Get booking ID for a specific slot
  const getBookingForSlot = (date: Date, timeSlot: string, bookings: any[]): string | undefined => {
    const [time, period] = timeSlot.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hour24, minutes, 0, 0);
    
    const booking = bookings.find(booking => {
      const bookingStart = new Date(booking.scheduledAt);
      return isSameDay(bookingStart, slotDateTime) && 
             bookingStart.getHours() === hour24 && 
             bookingStart.getMinutes() === minutes;
    });
    
    return booking?.id;
  };

  // Load availability when component mounts or healerId changes
  useEffect(() => {
    const today = new Date();
    const twoWeeksFromNow = addDays(today, 14);
    loadAvailability(today, twoWeeksFromNow);
  }, [healerId]);

  // Update available slots when selected date changes
  useEffect(() => {
    if (selectedDate && onAvailabilityChange) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const daySlots = availableSlots[dateKey] || [];
      const hasAvailable = daySlots.some(slot => slot.available);
      onAvailabilityChange(hasAvailable);
    }
  }, [selectedDate, availableSlots, onAvailabilityChange]);

  const getDateSlots = (date: Date | undefined): TimeSlot[] => {
    if (!date) return [];
    const dateKey = format(date, 'yyyy-MM-dd');
    return availableSlots[dateKey] || [];
  };

  const getAvailableSlotCount = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const slots = availableSlots[dateKey] || [];
    return slots.filter(slot => slot.available).length;
  };

  // Custom day content to show availability indicators
  const dayContent = (day: Date) => {
    const availableCount = getAvailableSlotCount(day);
    const hasSlots = availableCount > 0;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={isPast(day) ? "text-muted-foreground" : ""}>{day.getDate()}</span>
        {!isPast(day) && hasSlots && (
          <div className="absolute -top-1 -right-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        )}
        {!isPast(day) && !hasSlots && !isToday(day) && (
          <div className="absolute -top-1 -right-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };

  const currentSlots = getDateSlots(selectedDate);
  const availableSlots_current = currentSlots.filter(slot => slot.available);
  const bookedSlots = currentSlots.filter(slot => !slot.available && slot.bookingId);

  return (
    <div className="space-y-6">
      {/* Time Zone Selector */}
      <div className="space-y-2">
        <Label>Time Zone</Label>
        <Select value={timeZone} onValueChange={setTimeZone}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
            <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
            <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Choose Date
          </Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={(date) => isPast(date)}
            className="rounded-md border"
            components={{
              DayContent: ({ date }) => dayContent(date)
            }}
          />
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Available slots</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>No availability</span>
            </div>
          </div>
        </div>

        {/* Available Times */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Available Times {selectedDate && `- ${format(selectedDate, 'MMM dd')}`}
          </Label>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : selectedDate ? (
            <div className="space-y-4">
              {availableSlots_current.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableSlots_current.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      onClick={() => onTimeSelect(slot.time)}
                      className="justify-start text-xs h-8"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {slot.time}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No available slots for this date</p>
                </div>
              )}
              
              {bookedSlots.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Unavailable Times
                  </Label>
                  <div className="grid grid-cols-2 gap-1">
                    {bookedSlots.map((slot) => (
                      <Badge key={slot.time} variant="secondary" className="text-xs justify-center">
                        {slot.time}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
              <p>Select a date to view available times</p>
            </div>
          )}
        </div>
      </div>

      {/* Duration Impact Notice */}
      {duration > 60 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Extended Session Duration</p>
                <p className="text-xs text-muted-foreground">
                  Your {duration}-minute session may limit available time slots due to scheduling constraints.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingCalendar;