import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const CATEGORY_LABELS = {
  'REIKI_HEALING': 'Reiki Healing',
  'ENERGY_HEALING': 'Energy Healing',
  'SPIRITUAL_COUNSELING': 'Spiritual Counseling',
  'CHAKRA_ALIGNMENT': 'Chakra Alignment',
  'TAROT_READING': 'Tarot Reading',
  'MEDITATION_GUIDANCE': 'Meditation Guidance',
  'CRYSTAL_HEALING': 'Crystal Healing',
  'AURA_CLEANSING': 'Aura Cleansing',
  'SOUND_HEALING': 'Sound Healing',
  'BREATHWORK': 'Breathwork',
  'ASTROLOGY': 'Astrology',
  'NUMEROLOGY': 'Numerology'
}

function ServiceList({ onCreateNew, onEdit }) {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services/my-services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }

      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Fetch services error:', error)
      setError('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (serviceId, isActive) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update service')
      }

      // Update local state
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, isActive: !isActive }
          : service
      ))
    } catch (error) {
      console.error('Toggle service error:', error)
      alert('Failed to update service status')
    }
  }

  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete service')
      }

      // Remove from local state
      setServices(prev => prev.filter(service => service.id !== serviceId))
    } catch (error) {
      console.error('Delete service error:', error)
      alert('Failed to delete service')
    }
  }

  if (user?.userType !== 'HEALER') {
    return <div className="text-center text-red-600">Only healers can manage services</div>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
        <button
          onClick={onCreateNew}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Create New Service
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔮</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-500 mb-4">Create your first service to start accepting bookings</p>
          <button
            onClick={onCreateNew}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Service
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {service.imageUrl && (
                <img 
                  src={service.imageUrl} 
                  alt={service.title}
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {service.title}
                  </h3>
                  <div className="flex items-center ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    {CATEGORY_LABELS[service.category]}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{service.duration} minutes</span>
                    <span className="font-semibold text-indigo-600">${service.price}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(service)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(service.id, service.isActive)}
                    className={`flex-1 px-3 py-2 text-sm rounded-md ${
                      service.isActive
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="px-3 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ServiceList