import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import ImageUpload from '../ui/ImageUpload'

const SERVICE_CATEGORIES = [
  'REIKI_HEALING',
  'ENERGY_HEALING', 
  'SPIRITUAL_COUNSELING',
  'CHAKRA_ALIGNMENT',
  'TAROT_READING',
  'MEDITATION_GUIDANCE',
  'CRYSTAL_HEALING',
  'AURA_CLEANSING',
  'SOUND_HEALING',
  'BREATHWORK',
  'ASTROLOGY',
  'NUMEROLOGY'
]

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

function ServiceForm({ service, onSave, onCancel }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    price: '',
    category: SERVICE_CATEGORIES[0],
    imageUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title || '',
        description: service.description || '',
        duration: service.duration || 60,
        price: service.price?.toString() || '',
        category: service.category || SERVICE_CATEGORIES[0],
        imageUrl: service.imageUrl || ''
      })
    }
  }, [service])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (data) => {
    if (data.imageUrl) {
      setFormData(prev => ({
        ...prev,
        imageUrl: data.imageUrl
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const url = service 
        ? `${import.meta.env.VITE_API_URL}/services/${service.id}`
        : `${import.meta.env.VITE_API_URL}/services`
      
      const response = await fetch(url, {
        method: service ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save service')
      }

      const data = await response.json()
      onSave(data.service)
    } catch (error) {
      console.error('Service save error:', error)
      setError(error.message || 'Failed to save service')
    } finally {
      setLoading(false)
    }
  }

  if (user?.userType !== 'HEALER') {
    return <div className="text-center text-red-600">Only healers can create services</div>
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {service ? 'Edit Service' : 'Create New Service'}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. 60-Minute Reiki Healing Session"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe what your service includes and what clients can expect..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price ($) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            {SERVICE_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Image
          </label>
          <ImageUpload
            onUpload={handleImageUpload}
            currentImage={formData.imageUrl}
            variant="service"
            placeholder="Upload a service image"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ServiceForm