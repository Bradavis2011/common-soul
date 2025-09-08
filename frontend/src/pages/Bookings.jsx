import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import BookingCard from '../components/booking/BookingCard'

function Bookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [filter, user])

  const fetchBookings = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      let url = `${import.meta.env.VITE_API_URL}/bookings`
      
      const params = new URLSearchParams()
      
      // Add healer filter if user is a healer
      if (user.userType === 'HEALER') {
        params.append('healer', 'true')
      }
      
      if (filter !== 'all') {
        if (filter === 'upcoming') {
          params.append('upcoming', 'true')
        } else {
          params.append('status', filter.toUpperCase())
        }
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data)
    } catch (err) {
      setError('Failed to load bookings')
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBookingUpdate = (updatedBooking) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    )
  }

  const getFilteredBookings = () => {
    if (filter === 'upcoming') {
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.scheduledAt)
        const now = new Date()
        return bookingDate > now && booking.status !== 'CANCELLED'
      })
    }
    return bookings
  }

  const filteredBookings = getFilteredBookings()

  const getStatsText = () => {
    const total = bookings.length
    const pending = bookings.filter(b => b.status === 'PENDING').length
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length
    const completed = bookings.filter(b => b.status === 'COMPLETED').length
    
    return { total, pending, confirmed, completed }
  }

  const stats = getStatsText()

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-gray-600">Please log in to view your bookings.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          My {user.userType === 'HEALER' ? 'Sessions' : 'Bookings'}
        </h1>
        <p className="text-gray-600 mt-2">
          {user.userType === 'HEALER' 
            ? 'Manage your healing sessions and client bookings' 
            : 'Track your booked sessions and appointments'
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Total</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Confirmed</h3>
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Completed</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-sm rounded-full border ${
                filter === key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading bookings...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No bookings found.' 
              : `No ${filter} bookings found.`
            }
          </p>
          {filter === 'all' && user.userType === 'CUSTOMER' && (
            <p className="text-sm text-gray-400 mt-2">
              Visit the Discover page to book your first session!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onUpdate={handleBookingUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Bookings