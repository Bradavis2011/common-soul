import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import ReviewForm from '../reviews/ReviewForm'

function BookingCard({ booking, onUpdate }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
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

  const canCancel = () => {
    const isOwner = booking.customerId === user.id || booking.healerId === user.id
    const isPending = booking.status === 'PENDING'
    const isFuture = new Date(booking.scheduledAt) > new Date()
    return isOwner && isPending && isFuture
  }

  const canConfirm = () => {
    return booking.healerId === user.id && booking.status === 'PENDING'
  }

  const canComplete = () => {
    return booking.healerId === user.id && booking.status === 'CONFIRMED' && 
           new Date(booking.scheduledAt) <= new Date()
  }

  const updateBookingStatus = async (status, cancellationReason = '') => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, cancellationReason })
      })

      if (!response.ok) {
        throw new Error('Failed to update booking')
      }

      const updatedBooking = await response.json()
      onUpdate(updatedBooking)
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking status')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    const reason = prompt('Please provide a reason for cancellation (optional):')
    if (reason !== null) { // User didn't click cancel
      updateBookingStatus('CANCELLED', reason)
    }
  }

  const handleReviewSubmit = (reviewData) => {
    setShowReviewForm(false)
    // Refresh the booking data to show the review
    onUpdate({
      ...booking,
      reviews: booking.reviews ? [...booking.reviews, reviewData] : [reviewData]
    })
  }

  const { date, time } = formatDateTime(booking.scheduledAt)
  const isCustomerView = user.id === booking.customerId
  const otherUser = isCustomerView ? booking.healer : booking.customer

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.service.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            {isCustomerView ? 'Healer' : 'Customer'}: {otherUser.profile?.firstName} {otherUser.profile?.lastName}
          </p>
          <p className="text-sm text-gray-600">
            {date} at {time} ({booking.duration} minutes)
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">${booking.totalPrice}</p>
        </div>
      </div>

      {(booking.notes || booking.customerNotes || booking.healerNotes) && (
        <div className="mb-4">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {showNotes ? 'Hide Notes' : 'Show Notes'}
          </button>
          {showNotes && (
            <div className="mt-2 space-y-2">
              {booking.notes && (
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs font-medium text-gray-700">General Notes:</p>
                  <p className="text-sm text-gray-600">{booking.notes}</p>
                </div>
              )}
              {booking.customerNotes && isCustomerView && (
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-xs font-medium text-blue-700">Your Private Notes:</p>
                  <p className="text-sm text-blue-600">{booking.customerNotes}</p>
                </div>
              )}
              {booking.healerNotes && (
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-xs font-medium text-green-700">Healer Notes:</p>
                  <p className="text-sm text-green-600">{booking.healerNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {booking.cancellationReason && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-xs font-medium text-red-700">Cancellation Reason:</p>
          <p className="text-sm text-red-600">{booking.cancellationReason}</p>
        </div>
      )}

      <div className="flex gap-2">
        {canConfirm() && (
          <button
            onClick={() => updateBookingStatus('CONFIRMED')}
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
        )}
        {canComplete() && (
          <button
            onClick={() => updateBookingStatus('COMPLETED')}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Completing...' : 'Mark Complete'}
          </button>
        )}
        {canCancel() && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
        {booking.status === 'COMPLETED' && isCustomerView && !booking.reviews?.length && (
          <button 
            onClick={() => setShowReviewForm(true)}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
          >
            Leave Review
          </button>
        )}
        {booking.status === 'COMPLETED' && isCustomerView && booking.reviews?.length > 0 && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
            ✓ Review Submitted
          </span>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ReviewForm
                healer={booking.healer}
                service={booking.service}
                booking={booking}
                onSubmit={handleReviewSubmit}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingCard