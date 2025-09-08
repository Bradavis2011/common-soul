import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ServiceCard from '../components/discovery/ServiceCard'
import ReviewList from '../components/reviews/ReviewList'
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  AcademicCapIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

function HealerProfile() {
  const { healerId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [healer, setHealer] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    if (healerId) {
      fetchHealerData()
    }
  }, [healerId])

  const fetchHealerData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch healer profile
      const healerResponse = await fetch(`${import.meta.env.VITE_API_URL}/healers/${healerId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      
      if (!healerResponse.ok) {
        throw new Error('Healer not found')
      }
      
      const healerData = await healerResponse.json()
      setHealer(healerData)
      
      // Fetch healer's services
      const servicesResponse = await fetch(`${import.meta.env.VITE_API_URL}/services?healerId=${healerId}`)
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        setServices(servicesData.services || [])
      }
      
      
    } catch (error) {
      console.error('Error fetching healer data:', error)
      setError(error.message || 'Failed to load healer profile')
    } finally {
      setLoading(false)
    }
  }

  const handleBookService = (service) => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.userType !== 'CUSTOMER') {
      alert('Only customers can book services')
      return
    }
    // Navigate back to discovery with booking modal
    navigate('/discover')
    // TODO: Better integration with booking flow
  }


  const renderStars = (rating, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= Math.round(rating) ? (
            <StarIconSolid key={star} className={`${size} text-yellow-400`} />
          ) : (
            <StarIcon key={star} className={`${size} text-gray-300`} />
          )
        ))}
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/discover')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Back to Discovery
        </button>
      </div>
    )
  }

  if (!healer) {
    return null
  }

  const profile = healer.profile
  const healerInfo = profile?.healerProfile

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              {profile?.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-medium text-gray-400">
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                
                {healerInfo?.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {healerInfo.specialties.slice(0, 3).map((specialty, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                    {healerInfo.specialties.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        +{healerInfo.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {renderStars(0)}
                  <span className="text-gray-600">
                    Reviews will be shown below
                  </span>
                </div>

                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  {healerInfo?.yearsExperience && (
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{healerInfo.yearsExperience} years experience</span>
                    </div>
                  )}
                  {healerInfo?.location && (
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{healerInfo.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 md:mt-0">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span>Message</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>Book Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex space-x-8">
          {[
            { key: 'about', label: 'About' },
            { key: 'services', label: `Services (${services.length})` },
            { key: 'reviews', label: 'Reviews' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'about' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About {profile?.firstName}</h3>
            
            {healerInfo?.bio ? (
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed">{healerInfo.bio}</p>
              </div>
            ) : (
              <p className="text-gray-500 mb-6">No bio available.</p>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {healerInfo?.certifications?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <AcademicCapIcon className="w-5 h-5" />
                    Certifications
                  </h4>
                  <ul className="space-y-2">
                    {healerInfo.certifications.map((cert, index) => (
                      <li key={index} className="text-gray-600 text-sm">{cert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {healerInfo?.philosophyApproach && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <HeartIcon className="w-5 h-5" />
                    Philosophy & Approach
                  </h4>
                  <p className="text-gray-600 text-sm">{healerInfo.philosophyApproach}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            {services.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onBook={handleBookService}
                    onViewHealer={() => {}} // Already on healer profile
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔮</div>
                <p className="text-gray-500">No services available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <ReviewList
            healerId={healerId}
            showWriteReview={user?.userType === 'CUSTOMER' && user.id !== parseInt(healerId)}
          />
        )}
      </div>
    </div>
  )
}

export default HealerProfile