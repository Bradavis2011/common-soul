import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { XMarkIcon, UserCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'

function ProfileCompletionPrompt({ onStartWizard, onDismiss }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(0)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        calculateCompletion(data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCompletion = (profileData) => {
    const isHealer = user.userType === 'HEALER'
    let completed = 0
    let total = 0

    // Basic fields (required for both)
    const basicFields = ['firstName', 'lastName', 'bio', 'phone', 'location']
    basicFields.forEach(field => {
      total++
      if (profileData?.[field]) completed++
    })

    if (isHealer && profileData?.healerProfile) {
      // Healer specific fields
      const healerFields = ['specialties', 'hourlyRate', 'yearsExperience', 'education']
      healerFields.forEach(field => {
        total++
        if (profileData.healerProfile[field]) completed++
      })
    } else if (!isHealer && profileData?.customerProfile) {
      // Customer specific fields  
      const customerFields = ['interests', 'goals', 'budgetRange']
      customerFields.forEach(field => {
        total++
        if (profileData.customerProfile[field]) completed++
      })
    } else {
      // Add missing profile sections
      total += isHealer ? 4 : 3
    }

    const percentage = Math.round((completed / total) * 100)
    setCompletionPercentage(percentage)
  }

  const handleDismiss = () => {
    localStorage.setItem('profile-completion-dismissed', 'true')
    onDismiss()
  }

  if (loading || completionPercentage >= 80) {
    return null
  }

  const isHealer = user.userType === 'HEALER'

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg shadow-lg border border-indigo-200 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
      
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        title="Dismiss"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-full">
            {isHealer ? (
              <SparklesIcon className="h-8 w-8 text-white" />
            ) : (
              <UserCircleIcon className="h-8 w-8 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">Complete Your Profile</h3>
            <p className="text-white text-opacity-90">
              {completionPercentage}% complete
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-white bg-opacity-20 rounded-full h-3 mb-2">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <p className="text-white text-opacity-90 mb-6 leading-relaxed">
          {isHealer 
            ? "A complete profile helps potential customers find you and builds trust. Add your specialties, rates, and experience to attract more clients."
            : "Complete your profile to help healers understand your needs and provide personalized recommendations for your spiritual journey."
          }
        </p>

        <div className="flex gap-3">
          <button
            onClick={onStartWizard}
            className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Complete Profile
          </button>
          <button
            onClick={handleDismiss}
            className="border border-white border-opacity-30 text-white px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletionPrompt