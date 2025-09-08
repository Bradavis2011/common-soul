import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

function Calendar({ service, onDateSelect, selectedDate, availabilityData }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState([])

  useEffect(() => {
    generateCalendarDays()
  }, [currentDate, availabilityData])

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      const dateString = current.toISOString().split('T')[0]
      const isCurrentMonth = current.getMonth() === month
      const isToday = current.toDateString() === new Date().toDateString()
      const isPast = current < new Date().setHours(0, 0, 0, 0)
      const isSelected = selectedDate === dateString
      
      // Check if this date has availability data
      const dayAvailability = availabilityData[dateString]
      const hasAvailableSlots = dayAvailability?.availableSlots?.length > 0
      
      days.push({
        date: new Date(current),
        dateString,
        day: current.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isSelected,
        hasAvailableSlots,
        availableSlots: dayAvailability?.availableSlots || []
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    setCalendarDays(days)
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const handleDateClick = (day) => {
    if (day.isPast || !day.isCurrentMonth) return
    onDateSelect(day.dateString)
  }

  const getDayClasses = (day) => {
    let classes = 'h-12 w-full flex items-center justify-center text-sm border-t border-l relative cursor-pointer transition-colors'
    
    if (!day.isCurrentMonth) {
      classes += ' text-gray-300 bg-gray-50'
    } else if (day.isPast) {
      classes += ' text-gray-400 bg-gray-100 cursor-not-allowed'
    } else {
      classes += ' text-gray-900 hover:bg-indigo-50'
    }
    
    if (day.isToday) {
      classes += ' font-bold'
    }
    
    if (day.isSelected) {
      classes += ' bg-indigo-600 text-white hover:bg-indigo-700'
    }
    
    if (day.hasAvailableSlots && !day.isSelected) {
      classes += ' bg-green-50'
    }
    
    return classes
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-50 border-t border-l">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={getDayClasses(day)}
            onClick={() => handleDateClick(day)}
          >
            <span>{day.day}</span>
            {day.hasAvailableSlots && !day.isSelected && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></div>
            )}
            {day.isToday && !day.isSelected && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Available slots</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar