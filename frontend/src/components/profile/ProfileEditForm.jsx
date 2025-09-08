import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import AvatarUpload from './AvatarUpload'

const SPECIALTIES_OPTIONS = [
  'Reiki Healing',
  'Energy Healing', 
  'Spiritual Counseling',
  'Chakra Alignment',
  'Tarot Reading',
  'Meditation Guidance',
  'Crystal Healing',
  'Aura Cleansing',
  'Sound Healing',
  'Breathwork',
  'Astrology',
  'Numerology'
]

const SPIRITUAL_INTERESTS = [
  'Meditation',
  'Energy Healing',
  'Chakras',
  'Crystal Healing',
  'Astrology',
  'Tarot',
  'Reiki',
  'Spiritual Counseling',
  'Past Life Regression',
  'Angel Guidance',
  'Manifestation',
  'Mindfulness'
]

function ProfileEditForm({ onClose }) {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    timezone: '',
    avatarUrl: ''
  })

  const [healerInfo, setHealerInfo] = useState({
    specialties: [],
    hourlyRate: '',
    yearsExperience: '',
    education: '',
    languages: [],
    sessionTypes: [],
    consultationFee: '',
    sessionDuration: '60',
    cancellationPolicy: '',
    paymentMethods: []
  })

  const [customerInfo, setCustomerInfo] = useState({
    interests: [],
    goals: '',
    previousExperience: '',
    budgetRange: '',
    sessionFrequency: '',
    communicationStyle: '',
    preferredSessionTypes: []
  })

  useEffect(() => {
    if (user?.profile) {
      setBasicInfo({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        bio: user.profile.bio || '',
        phone: user.profile.phone || '',
        location: user.profile.location || '',
        website: user.profile.website || '',
        timezone: user.profile.timezone || '',
        avatarUrl: user.profile.avatarUrl || ''
      })

      if (user.userType === 'HEALER' && user.profile.healerProfile) {
        const hp = user.profile.healerProfile
        setHealerInfo({
          specialties: hp.specialties ? JSON.parse(hp.specialties) : [],
          hourlyRate: hp.hourlyRate || '',
          yearsExperience: hp.yearsExperience || '',
          education: hp.education || '',
          languages: hp.languages ? JSON.parse(hp.languages) : [],
          sessionTypes: hp.sessionTypes ? JSON.parse(hp.sessionTypes) : [],
          consultationFee: hp.consultationFee || '',
          sessionDuration: hp.sessionDuration || '60',
          cancellationPolicy: hp.cancellationPolicy || '',
          paymentMethods: hp.paymentMethods ? JSON.parse(hp.paymentMethods) : []
        })
      }

      if (user.userType === 'CUSTOMER' && user.profile.customerProfile) {
        const cp = user.profile.customerProfile
        setCustomerInfo({
          interests: cp.interests ? JSON.parse(cp.interests) : [],
          goals: cp.goals || '',
          previousExperience: cp.previousExperience || '',
          budgetRange: cp.budgetRange || '',
          sessionFrequency: cp.sessionFrequency || '',
          communicationStyle: cp.communicationStyle || '',
          preferredSessionTypes: cp.preferredSessionTypes ? JSON.parse(cp.preferredSessionTypes) : []
        })
      }
    }
  }, [user])

  const handleBasicInfoChange = (e) => {
    setBasicInfo({
      ...basicInfo,
      [e.target.name]: e.target.value
    })
  }

  const handleHealerInfoChange = (e) => {
    setHealerInfo({
      ...healerInfo,
      [e.target.name]: e.target.value
    })
  }

  const handleCustomerInfoChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    })
  }

  const handleArrayChange = (field, value, type = 'healer') => {
    const targetInfo = type === 'healer' ? healerInfo : customerInfo
    const setter = type === 'healer' ? setHealerInfo : setCustomerInfo
    
    const currentArray = targetInfo[field] || []
    const updatedArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    setter({
      ...targetInfo,
      [field]: updatedArray
    })
  }

  const handleAvatarUpdate = (avatarUrl) => {
    setBasicInfo({
      ...basicInfo,
      avatarUrl: avatarUrl
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          basicInfo,
          healerInfo,
          customerInfo
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const data = await response.json()
      setMessage('Profile updated successfully!')
      
      // Update user context with the updated profile from server
      updateUser({ 
        ...user,
        profile: data.profile 
      })
      
      // Close the form after successful update
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose()
        } else {
          window.history.back()
        }
      }, 1500)

    } catch (error) {
      console.error('Profile update error:', error)
      setMessage(error.message || 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('success') 
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          {/* Avatar Upload */}
          <div className="mb-8">
            <AvatarUpload 
              currentAvatarUrl={basicInfo.avatarUrl}
              onAvatarUpdate={handleAvatarUpdate}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={basicInfo.firstName}
                onChange={handleBasicInfoChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={basicInfo.lastName}
                onChange={handleBasicInfoChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={basicInfo.phone}
                onChange={handleBasicInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={basicInfo.location}
                onChange={handleBasicInfoChange}
                placeholder="City, State/Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={basicInfo.website}
                onChange={handleBasicInfoChange}
                placeholder="https://your-website.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                name="timezone"
                value={basicInfo.timezone}
                onChange={handleBasicInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select timezone...</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={basicInfo.bio}
              onChange={handleBasicInfoChange}
              rows={4}
              placeholder="Tell us about yourself..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Healer-Specific Section */}
        {user.userType === 'HEALER' && (
          <div className="bg-indigo-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Healer Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SPECIALTIES_OPTIONS.map((specialty) => (
                    <label key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={healerInfo.specialties.includes(specialty)}
                        onChange={() => handleArrayChange('specialties', specialty, 'healer')}
                        className="mr-2 rounded text-indigo-600"
                      />
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={healerInfo.hourlyRate}
                    onChange={handleHealerInfoChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="yearsExperience"
                    value={healerInfo.yearsExperience}
                    onChange={handleHealerInfoChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education & Certifications
                </label>
                <textarea
                  name="education"
                  value={healerInfo.education}
                  onChange={handleHealerInfoChange}
                  rows={3}
                  placeholder="Describe your educational background and certifications..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Customer-Specific Section */}
        {user.userType === 'CUSTOMER' && (
          <div className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Preferences</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spiritual Interests
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SPIRITUAL_INTERESTS.map((interest) => (
                    <label key={interest} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customerInfo.interests.includes(interest)}
                        onChange={() => handleArrayChange('interests', interest, 'customer')}
                        className="mr-2 rounded text-purple-600"
                      />
                      <span className="text-sm">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Healing Goals
                </label>
                <textarea
                  name="goals"
                  value={customerInfo.goals}
                  onChange={handleCustomerInfoChange}
                  rows={3}
                  placeholder="What are you hoping to achieve through spiritual healing?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <select
                    name="budgetRange"
                    value={customerInfo.budgetRange}
                    onChange={handleCustomerInfoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select budget range...</option>
                    <option value="BUDGET_FRIENDLY">$0-50 per session</option>
                    <option value="MODERATE">$51-100 per session</option>
                    <option value="PREMIUM">$101-200 per session</option>
                    <option value="LUXURY">$200+ per session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Frequency
                  </label>
                  <select
                    name="sessionFrequency"
                    value={customerInfo.sessionFrequency}
                    onChange={handleCustomerInfoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select frequency...</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="AS_NEEDED">As needed</option>
                    <option value="INTENSIVE">Intensive (multiple per week)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfileEditForm