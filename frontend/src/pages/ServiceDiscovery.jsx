import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ServiceCard from '../components/discovery/ServiceCard'
import ServiceFilter from '../components/discovery/ServiceFilter'
import BookingCalendarInterface from '../components/booking/BookingCalendarInterface'

function ServiceDiscovery() {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    priceRange: '',
    durationRange: '',
    sortBy: 'newest'
  })

  useEffect(() => {
    fetchServices()
  }, [filters])

  const fetchServices = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters.categories?.length > 0) {
        filters.categories.forEach(category => {
          params.append('category', category)
        })
      }
      
      if (filters.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/services?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }

      const data = await response.json()
      let filteredServices = data.services || []

      // Apply client-side filtering
      filteredServices = applyClientFilters(filteredServices)
      
      setServices(filteredServices)
    } catch (error) {
      console.error('Fetch services error:', error)
      setError('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const applyClientFilters = (serviceList) => {
    let filtered = [...serviceList]

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        `${service.healer?.profile?.firstName || ''} ${service.healer?.profile?.lastName || ''}`.toLowerCase().includes(searchTerm)
      )
    }

    // Filter by price range
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.includes('+') 
        ? [parseInt(filters.priceRange.replace('+', '')), Infinity]
        : filters.priceRange.split('-').map(p => parseInt(p))
      
      filtered = filtered.filter(service => 
        service.price >= min && service.price <= max
      )
    }

    // Filter by duration range
    if (filters.durationRange) {
      const [min, max] = filters.durationRange.includes('+')
        ? [parseInt(filters.durationRange.replace('+', '')), Infinity]
        : filters.durationRange.split('-').map(d => parseInt(d))
      
      filtered = filtered.filter(service => 
        service.duration >= min && service.duration <= max
      )
    }

    // Sort results
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'duration-short':
        filtered.sort((a, b) => a.duration - b.duration)
        break
      case 'duration-long':
        filtered.sort((a, b) => b.duration - a.duration)
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
    }

    return filtered
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      priceRange: '',
      durationRange: '',
      sortBy: 'newest'
    })
  }

  const handleBookService = (service) => {
    if (user.userType !== 'CUSTOMER') {
      alert('Only customers can book services')
      return
    }
    setSelectedService(service)
    setShowBookingForm(true)
  }

  const handleBookingSuccess = (booking) => {
    setShowBookingForm(false)
    setSelectedService(null)
    
    // Better success messaging
    const bookingDate = new Date(booking.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
    const bookingTime = new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    
    // You could replace this with a toast notification or modal in the future
    alert(`🎉 Booking confirmed!\n\n${booking.service.title}\n${bookingDate} at ${bookingTime}\n\nCheck your bookings page for details.`)
  }

  const handleBookingCancel = () => {
    setShowBookingForm(false)
    setSelectedService(null)
  }

  const handleViewHealer = (healerId) => {
    window.open(`/healer/${healerId}`, '_blank')
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Services</h1>
        <p className="text-gray-600">
          Find the perfect spiritual healing service for your journey
        </p>
      </div>

      <ServiceFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500 mb-4">
            {filters.search || filters.categories?.length > 0 || filters.priceRange || filters.durationRange
              ? 'Try adjusting your filters to see more results'
              : 'No services are currently available'
            }
          </p>
          {(filters.search || filters.categories?.length > 0 || filters.priceRange || filters.durationRange) && (
            <button
              onClick={handleClearFilters}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              {services.length} service{services.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onBook={handleBookService}
                onViewHealer={handleViewHealer}
              />
            ))}
          </div>
        </>
      )}

      {/* Booking Modal */}
      {showBookingForm && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <BookingCalendarInterface
              service={selectedService}
              onSuccess={handleBookingSuccess}
              onCancel={handleBookingCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceDiscovery