import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircleIcon, CalendarIcon, CreditCardIcon } from '@heroicons/react/24/outline'

function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [paymentStatus, setPaymentStatus] = useState('checking')
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')

  const bookingId = searchParams.get('booking')
  const paymentParam = searchParams.get('payment')

  useEffect(() => {
    if (bookingId && paymentParam === 'success') {
      checkPaymentStatus()
    } else {
      setError('Invalid payment confirmation link')
      setPaymentStatus('error')
    }
  }, [bookingId, paymentParam])

  const checkPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/status/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to verify payment status')
      }

      const paymentData = await response.json()
      
      // Also fetch the updated booking details
      const bookingResponse = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json()
        setBooking(bookingData)
      }

      if (paymentData.status === 'COMPLETED') {
        setPaymentStatus('success')
      } else if (paymentData.status === 'PENDING') {
        setPaymentStatus('pending')
      } else {
        setPaymentStatus('failed')
        setError('Payment was not completed successfully')
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      setError('Unable to verify payment status')
      setPaymentStatus('error')
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  if (paymentStatus === 'checking') {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'error' || paymentStatus === 'failed') {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">✕</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/bookings"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View Bookings
            </Link>
            <Link
              to="/discover"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { date, time } = booking ? formatDateTime(booking.scheduledAt) : { date: '', time: '' }

  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your healing session has been booked and confirmed.
        </p>

        {/* Booking Details */}
        {booking && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Booking Confirmation
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{booking.service?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Healer:</span>
                <span className="font-medium">
                  {booking.healer?.profile?.firstName} {booking.healer?.profile?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium">{date} at {time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{booking.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                  {booking.status}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                <span>Amount Paid:</span>
                <span className="text-green-600">${booking.totalPrice}</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• You'll receive a confirmation email shortly</li>
            <li>• Your healer will contact you before the session</li>
            <li>• You can manage this booking from your Bookings page</li>
            <li>• Cancel up to 24 hours before if needed</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/bookings"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <CalendarIcon className="h-5 w-5" />
            View My Bookings
          </Link>
          <Link
            to="/discover"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Browse More Services
          </Link>
        </div>

        {/* Support */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Need help? <Link to="/support" className="text-indigo-600 hover:text-indigo-700">Contact our support team</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess