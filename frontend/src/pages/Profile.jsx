import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileEditForm from '../components/profile/ProfileEditForm'
import ImageUpload from '../components/ui/ImageUpload'
import ProfileCompletionWizard from '../components/profile/ProfileCompletionWizard'

function Profile() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [showCompletionWizard, setShowCompletionWizard] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const data = await response.json()
        setProfile(data.profile)
        
        // Update user context with fresh profile data
        updateUser({ 
          ...user,
          profile: data.profile 
        })
      } catch (error) {
        console.error('Fetch profile error:', error)
        setError(error.message)
        // Fallback to context profile if API fails
        setProfile(user.profile)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id])

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-red-600">Error loading profile: {error}</div>
      </div>
    )
  }
  const isHealer = user.userType === 'HEALER'
  const healerProfile = profile?.healerProfile
  const customerProfile = profile?.customerProfile

  // Calculate profile completion
  const calculateCompletion = () => {
    let completed = 0
    let total = 0
    
    // Basic fields
    const basicFields = ['firstName', 'lastName', 'bio', 'phone', 'location']
    basicFields.forEach(field => {
      total++
      if (profile?.[field]) completed++
    })

    if (isHealer && healerProfile) {
      const healerFields = ['specialties', 'hourlyRate', 'yearsExperience', 'education']
      healerFields.forEach(field => {
        total++
        if (healerProfile[field]) completed++
      })
    }

    if (!isHealer && customerProfile) {
      const customerFields = ['interests', 'goals', 'budgetRange']
      customerFields.forEach(field => {
        total++
        if (customerProfile[field]) completed++
      })
    }

    return Math.round((completed / total) * 100)
  }

  const completionPercentage = calculateCompletion()

  const handleCloseEdit = () => {
    setIsEditing(false)
    // Refresh profile data
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setProfile(data.profile)
          updateUser({ 
            ...user,
            profile: data.profile 
          })
        }
      } catch (error) {
        console.error('Refresh profile error:', error)
      }
    }
    fetchProfile()
  }

  const handleAvatarUpload = (data) => {
    if (data.avatarUrl) {
      const updatedProfile = { ...profile, avatarUrl: data.avatarUrl }
      setProfile(updatedProfile)
      updateUser({ 
        ...user,
        profile: updatedProfile 
      })
      setShowAvatarUpload(false)
    }
  }

  if (isEditing) {
    return <ProfileEditForm onClose={handleCloseEdit} />
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer" onClick={() => setShowAvatarUpload(true)}>
                {profile?.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-400">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowAvatarUpload(true)}
                className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1 hover:bg-indigo-700 transition-colors"
                title="Upload Avatar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="ml-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile?.firstName} {profile?.lastName}
              </h1>
              <p className="text-lg text-gray-600 capitalize">
                {user.userType.toLowerCase()}
              </p>
              {profile?.location && (
                <p className="text-gray-500 mt-1">📍 {profile.location}</p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {profile?.bio && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Profile Completion Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Profile Completion</h2>
          <span className="text-lg font-bold text-indigo-600">{completionPercentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Complete your profile to attract more {isHealer ? 'customers' : 'ideal healers'}!</p>
          {completionPercentage < 100 && (
            <p className="mt-2 text-indigo-600">
              Missing information: {isHealer ? 'Add specialties, hourly rate, and experience' : 'Add interests, goals, and budget preferences'}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Email</span>
              <p className="text-gray-900">{user.email}</p>
            </div>
            
            {profile?.phone && (
              <div>
                <span className="text-sm font-medium text-gray-500">Phone</span>
                <p className="text-gray-900">{profile.phone}</p>
              </div>
            )}
            
            {profile?.website && (
              <div>
                <span className="text-sm font-medium text-gray-500">Website</span>
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
                  {profile.website}
                </a>
              </div>
            )}
            
            {profile?.timezone && (
              <div>
                <span className="text-sm font-medium text-gray-500">Timezone</span>
                <p className="text-gray-900">{profile.timezone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Role-Specific Information */}
        {isHealer && healerProfile && (
          <div className="bg-indigo-50 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Healer Information</h2>
            
            <div className="space-y-4">
              {healerProfile.specialties && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Specialties</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {JSON.parse(healerProfile.specialties).map((specialty) => (
                      <span key={specialty} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {healerProfile.hourlyRate && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Hourly Rate</span>
                  <p className="text-gray-900">${healerProfile.hourlyRate}/hour</p>
                </div>
              )}
              
              {healerProfile.yearsExperience && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Experience</span>
                  <p className="text-gray-900">{healerProfile.yearsExperience} years</p>
                </div>
              )}
              
              {healerProfile.education && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Education & Certifications</span>
                  <p className="text-gray-900 text-sm leading-relaxed">{healerProfile.education}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isHealer && customerProfile && (
          <div className="bg-purple-50 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Preferences</h2>
            
            <div className="space-y-4">
              {customerProfile.interests && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Interests</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {JSON.parse(customerProfile.interests).map((interest) => (
                      <span key={interest} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {customerProfile.goals && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Healing Goals</span>
                  <p className="text-gray-900 text-sm leading-relaxed">{customerProfile.goals}</p>
                </div>
              )}
              
              {customerProfile.budgetRange && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Budget Range</span>
                  <p className="text-gray-900">
                    {customerProfile.budgetRange === 'BUDGET_FRIENDLY' && '$0-50 per session'}
                    {customerProfile.budgetRange === 'MODERATE' && '$51-100 per session'}
                    {customerProfile.budgetRange === 'PREMIUM' && '$101-200 per session'}
                    {customerProfile.budgetRange === 'LUXURY' && '$200+ per session'}
                  </p>
                </div>
              )}
              
              {customerProfile.sessionFrequency && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Preferred Frequency</span>
                  <p className="text-gray-900 capitalize">{customerProfile.sessionFrequency.replace('_', ' ').toLowerCase()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty state for incomplete profiles */}
      {completionPercentage < 50 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Complete Your Profile</h3>
          <p className="text-yellow-700 mb-4">
            A complete profile helps you {isHealer ? 'attract more customers and build trust' : 'find the perfect healers for your needs'}.
          </p>
          <button
            onClick={() => setShowCompletionWizard(true)}
            className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 transition-colors"
          >
            Complete Profile Now
          </button>
        </div>
      )}

      {/* Quick Stats for Healers */}
      {isHealer && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-2xl font-bold text-indigo-600">0</div>
            <div className="text-sm text-gray-600">Active Services</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">-</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upload Avatar</h3>
              <button
                onClick={() => setShowAvatarUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ImageUpload
                onUpload={handleAvatarUpload}
                currentImage={profile?.avatarUrl}
                variant="avatar"
                placeholder="Upload your profile picture"
              />
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion Wizard */}
      {showCompletionWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ProfileCompletionWizard
                onClose={() => setShowCompletionWizard(false)}
                onComplete={() => {
                  setShowCompletionWizard(false)
                  // Refresh profile data
                  window.location.reload()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile