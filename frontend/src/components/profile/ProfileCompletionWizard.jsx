import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  CheckCircleIcon, 
  ClockIcon,
  ArrowRightIcon,
  UserCircleIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  BanknotesIcon,
  AcademicCapIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

function ProfileCompletionWizard({ onClose, onComplete }) {
  const { user, updateUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completionData, setCompletionData] = useState({})

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
        initializeCompletionData(data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeCompletionData = (profileData) => {
    const isHealer = user.userType === 'HEALER'
    
    setCompletionData({
      // Basic Info
      firstName: profileData?.firstName || '',
      lastName: profileData?.lastName || '',
      bio: profileData?.bio || '',
      phone: profileData?.phone || '',
      location: profileData?.location || '',
      website: profileData?.website || '',
      timezone: profileData?.timezone || '',
      
      // Healer specific
      ...(isHealer && {
        specialties: profileData?.healerProfile?.specialties ? JSON.parse(profileData.healerProfile.specialties) : [],
        hourlyRate: profileData?.healerProfile?.hourlyRate || '',
        yearsExperience: profileData?.healerProfile?.yearsExperience || '',
        education: profileData?.healerProfile?.education || '',
        certifications: profileData?.healerProfile?.certifications || ''
      }),
      
      // Customer specific  
      ...(!isHealer && {
        interests: profileData?.customerProfile?.interests ? JSON.parse(profileData.customerProfile.interests) : [],
        goals: profileData?.customerProfile?.goals || '',
        budgetRange: profileData?.customerProfile?.budgetRange || '',
        sessionFrequency: profileData?.customerProfile?.sessionFrequency || ''
      })
    })
  }

  const isHealer = user.userType === 'HEALER'

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Tell us about yourself',
      icon: UserCircleIcon,
      fields: ['firstName', 'lastName', 'bio']
    },
    {
      id: 'contact', 
      title: 'Contact Details',
      description: 'How can people reach you?',
      icon: PhoneIcon,
      fields: ['phone', 'location', 'website', 'timezone']
    },
    ...(isHealer ? [
      {
        id: 'expertise',
        title: 'Your Expertise', 
        description: 'What healing modalities do you practice?',
        icon: SparklesIcon,
        fields: ['specialties', 'yearsExperience']
      },
      {
        id: 'professional',
        title: 'Professional Info',
        description: 'Your rates and qualifications',
        icon: AcademicCapIcon,
        fields: ['hourlyRate', 'education', 'certifications']
      }
    ] : [
      {
        id: 'preferences',
        title: 'Your Interests',
        description: 'What kind of healing are you seeking?',
        icon: HeartIcon,
        fields: ['interests', 'goals']
      },
      {
        id: 'budget',
        title: 'Session Preferences',
        description: 'Your budget and frequency preferences',
        icon: BanknotesIcon,
        fields: ['budgetRange', 'sessionFrequency']
      }
    ])
  ]

  const calculateProgress = () => {
    const totalFields = steps.reduce((acc, step) => acc + step.fields.length, 0)
    const completedFields = steps.reduce((acc, step) => {
      const stepCompleted = step.fields.filter(field => {
        const value = completionData[field]
        return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim().length > 0)
      }).length
      return acc + stepCompleted
    }, 0)
    
    return Math.round((completedFields / totalFields) * 100)
  }

  const isStepComplete = (step) => {
    return step.fields.every(field => {
      const value = completionData[field]
      return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim().length > 0)
    })
  }

  const handleInputChange = (field, value) => {
    setCompletionData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(completionData)
      })

      if (response.ok) {
        const data = await response.json()
        updateUser({ ...user, profile: data.profile })
        onComplete()
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      console.error('Save profile error:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const renderStepContent = () => {
    const step = steps[currentStep]
    if (!step) return null

    return (
      <div className="space-y-6">
        {step.fields.map(field => renderField(field))}
      </div>
    )
  }

  const renderField = (field) => {
    const value = completionData[field]

    switch (field) {
      case 'firstName':
      case 'lastName':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field === 'firstName' ? 'First Name' : 'Last Name'} *
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        )

      case 'bio':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About You *
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={isHealer ? "Describe your healing philosophy and approach..." : "Tell us about yourself and what you're looking for..."}
              required
            />
          </div>
        )

      case 'phone':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        )

      case 'location':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="City, State/Country"
            />
          </div>
        )

      case 'website':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://yourwebsite.com"
            />
          </div>
        )

      case 'timezone':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select timezone</option>
              <option value="EST">Eastern (EST)</option>
              <option value="CST">Central (CST)</option>
              <option value="MST">Mountain (MST)</option>
              <option value="PST">Pacific (PST)</option>
              <option value="GMT">GMT</option>
              <option value="CET">Central European (CET)</option>
            </select>
          </div>
        )

      case 'specialties':
      case 'interests':
        const options = field === 'specialties' 
          ? ['Reiki', 'Energy Healing', 'Chakra Alignment', 'Crystal Healing', 'Sound Healing', 'Meditation', 'Breathwork', 'Spiritual Counseling']
          : ['Stress Relief', 'Emotional Healing', 'Physical Wellness', 'Spiritual Growth', 'Relationship Issues', 'Career Guidance', 'Self-Discovery']
        
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field === 'specialties' ? 'Specialties' : 'Interests'} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {options.map(option => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value.includes(option)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...value, option]
                        : value.filter(item => item !== option)
                      handleInputChange(field, newValue)
                    }}
                    className="mr-2 rounded text-indigo-600"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'hourlyRate':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate ($) *
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="75"
              min="0"
            />
          </div>
        )

      case 'yearsExperience':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience *
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="5"
              min="0"
            />
          </div>
        )

      case 'education':
      case 'certifications':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field === 'education' ? 'Education & Training' : 'Certifications'}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={field === 'education' 
                ? "List your relevant education, training, and courses..."
                : "List your certifications and professional credentials..."
              }
            />
          </div>
        )

      case 'goals':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Healing Goals *
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What are you hoping to achieve through healing sessions?"
            />
          </div>
        )

      case 'budgetRange':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Range per Session
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select budget range</option>
              <option value="BUDGET_FRIENDLY">$0-50 per session</option>
              <option value="MODERATE">$51-100 per session</option>
              <option value="PREMIUM">$101-200 per session</option>
              <option value="LUXURY">$200+ per session</option>
            </select>
          </div>
        )

      case 'sessionFrequency':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Session Frequency
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select frequency</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BI_WEEKLY">Bi-weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="AS_NEEDED">As needed</option>
            </select>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
        <p className="text-gray-600">
          Help others discover you by completing your profile information
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>{calculateProgress()}% complete</span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Steps Sidebar */}
        <div className="md:col-span-1">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isComplete = isStepComplete(step)
              
              return (
                <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  isActive 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : isComplete 
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isComplete 
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                  }`}>
                    {isComplete ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-indigo-900' : isComplete ? 'text-green-900' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg border p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {steps[currentStep]?.title}
              </h2>
              <p className="text-gray-600">{steps[currentStep]?.description}</p>
            </div>

            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={currentStep === 0 ? onClose : handleBack}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                {currentStep === 0 ? 'Close' : 'Back'}
              </button>

              <button
                onClick={handleNext}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete Profile' : 'Next'}
                {!saving && currentStep < steps.length - 1 && <ArrowRightIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletionWizard