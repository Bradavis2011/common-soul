import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Calendar from './Calendar'
import PaymentInterface from '../payment/PaymentInterface'
import { ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

function BookingCalendarInterface({ service, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availabilityData, setAvailabilityData] = useState({})
  const [availableSlots, setAvailableSlots] = useState([])
  const [notes, setNotes] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState('')
  const [loadedMonths, setLoadedMonths] = useState(new Set())
  const [step, setStep] = useState('booking') // 'booking' or 'payment'
  const [createdBooking, setCreatedBooking] = useState(null)

  // Load availability for multiple dates when calendar changes
  useEffect(() => {
    loadMonthAvailability(new Date())
  }, [])

  useEffect(() => {
    if (selectedDate) {
      const dateData = availabilityData[selectedDate]
      if (dateData) {
        setAvailableSlots(dateData.availableSlots)
      } else {
        fetchAvailableSlots(selectedDate)
      }
    }
  }, [selectedDate, availabilityData])

  const loadMonthAvailability = async (date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
    if (loadedMonths.has(monthKey)) return

    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    const promises = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d >= new Date().setHours(0, 0, 0, 0)) {
        const dateString = d.toISOString().split('T')[0]
        promises.push(fetchAvailableSlots(dateString, false))
      }
    }

    await Promise.all(promises)
    setLoadedMonths(prev => new Set([...prev, monthKey]))
  }

  const fetchAvailableSlots = async (dateString, setLoading = true) => {
    if (setLoading) setLoadingSlots(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/bookings/availability/${service.id}?date=${dateString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch available slots')
      }

      const data = await response.json()
      
      setAvailabilityData(prev => ({
        ...prev,
        [dateString]: {
          availableSlots: data.availableSlots,
          service: data.service
        }
      }))

      if (setLoading) {
        setAvailableSlots(data.availableSlots)
      }
    } catch (err) {
      if (setLoading) {
        setError('Failed to load available time slots')
      }
    } finally {
      if (setLoading) {
        setLoadingSlots(false)
      }
    }
  }

  const handleDateSelect = (dateString) => {
    setSelectedDate(dateString)
    setSelectedTime('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time')
      return
    }

    setLoading(true)
    setError('')

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`)
      
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: service.id,
          scheduledAt: scheduledAt.toISOString(),
          notes,
          customerNotes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const booking = await response.json()
      setCreatedBooking(booking)
      setStep('payment')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = (paymentData) => {
    onSuccess({
      booking: createdBooking,
      payment: paymentData
    })
  }

  const handlePaymentCancel = () => {
    setStep('booking')
    setCreatedBooking(null)
  }

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Show payment interface if in payment step
  if (step === 'payment' && createdBooking) {
    return (
      <PaymentInterface
        booking={createdBooking}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <h2 className="text-2xl font-bold text-white">Book Your Session</h2>
        <p className="text-indigo-100 mt-1">Select a date and time that works for you</p>
      </div>

      <div className="p-6">
        {/* Service Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{service.duration} minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <span>${service.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Select Date</h4>
            <Calendar
              service={service}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              availabilityData={availabilityData}
            />
          </div>

          {/* Time Selection & Form */}
          <div>
            {selectedDate && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Available Times for {formatDate(selectedDate)}
                </h4>
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading available times...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {availableSlots.map((slot, index) => {
                      const timeValue = new Date(slot.time).toTimeString().slice(0, 5)
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedTime(timeValue)}
                          className={`p-3 text-sm border rounded-lg transition-all ${
                            selectedTime === timeValue
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300'
                          }`}
                        >
                          {formatTime(slot.time)}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">No available times for this date</p>
                    <p className="text-xs text-gray-400 mt-1">Please select a different date</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes Form */}
            {selectedDate && selectedTime && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Any special requests or information for the healer..."
                  />
                </div>

                <div>
                  <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Private Notes (optional)
                  </label>
                  <textarea
                    id="customerNotes"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Personal notes for your reference (only you will see these)..."
                  />
                </div>

                {/* Booking Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Booking Summary</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Service:</strong> {service.title}</p>
                    <p><strong>Date:</strong> {formatDate(selectedDate)}</p>
                    <p><strong>Time:</strong> {formatTime(`2000-01-01T${selectedTime}`)}</p>
                    <p><strong>Duration:</strong> {service.duration} minutes</p>
                    <p><strong>Total:</strong> ${service.price}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Booking...</span>
                      </div>
                    ) : (
                      `Confirm Booking - $${service.price}`
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingCalendarInterface