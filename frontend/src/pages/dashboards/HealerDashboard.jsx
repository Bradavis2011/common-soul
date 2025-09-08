import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import ProfileCompletionPrompt from '../../components/profile/ProfileCompletionPrompt'
import ProfileCompletionWizard from '../../components/profile/ProfileCompletionWizard'
import { 
  CreditCardIcon, 
  CalendarDaysIcon, 
  StarIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

function HealerDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState({
    services: [],
    bookings: [],
    stats: {
      activeServices: 0,
      totalBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
      totalEarnings: 0,
      averageRating: 0,
      totalReviews: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [recentBookings, setRecentBookings] = useState([])
  const [showPrompt, setShowPrompt] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch services
      const servicesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/services/my-services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // Fetch bookings
      const bookingsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const services = servicesResponse.ok ? (await servicesResponse.json()).services || [] : []
      const bookings = bookingsResponse.ok ? await bookingsResponse.json() : []
      
      // Calculate stats
      const activeServices = services.filter(s => s.isActive).length
      const totalBookings = bookings.length
      const pendingBookings = bookings.filter(b => b.status === 'PENDING').length
      const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length
      const totalEarnings = bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (parseFloat(b.totalPrice) || 0), 0)
      
      // Get recent bookings (last 5)
      const recent = bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      
      setDashboardData({
        services,
        bookings,
        stats: {
          activeServices,
          totalBookings,
          pendingBookings,
          completedBookings,
          totalEarnings,
          averageRating: 0, // TODO: Calculate from reviews
          totalReviews: 0    // TODO: Fetch reviews
        }
      })
      setRecentBookings(recent)
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.profile?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">Manage your healing services and bookings</p>
      </div>

      {/* Profile Completion Prompt */}
      {showPrompt && !localStorage.getItem('profile-completion-dismissed') && (
        <div className="mb-8">
          <ProfileCompletionPrompt
            onStartWizard={() => {
              setShowPrompt(false)
              setShowWizard(true)
            }}
            onDismiss={() => setShowPrompt(false)}
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Active Services</h3>
              <p className="text-2xl font-bold text-indigo-600">{dashboardData.stats.activeServices}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
              <p className="text-2xl font-bold text-green-600">{dashboardData.stats.totalBookings}</p>
            </div>
            <CalendarDaysIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.stats.pendingBookings}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
              <p className="text-2xl font-bold text-emerald-600">
                ${dashboardData.stats.totalEarnings.toFixed(2)}
              </p>
            </div>
            <CreditCardIcon className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Recent Bookings and Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
            <Link 
              to="/bookings" 
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View all</span>
              <EyeIcon className="h-4 w-4" />
            </Link>
          </div>
          
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {booking.customer?.profile?.firstName} {booking.customer?.profile?.lastName}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{booking.service?.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(booking.scheduledAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${booking.totalPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              to="/services" 
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 block transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Manage Services</div>
                  <div className="text-sm text-gray-500">Create, edit, or deactivate services</div>
                </div>
              </div>
            </Link>
            
            <Link 
              to="/bookings" 
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 block transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarDaysIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">View All Bookings</div>
                  <div className="text-sm text-gray-500">Manage appointments and schedule</div>
                </div>
              </div>
            </Link>
            
            <Link 
              to="/profile" 
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 block transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Update Profile</div>
                  <div className="text-sm text-gray-500">Edit your healer profile and specialties</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Service Performance (if has services) */}
      {dashboardData.services.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Performance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.services.slice(0, 6).map(service => {
              const serviceBookings = dashboardData.bookings.filter(b => b.serviceId === service.id)
              return (
                <div key={service.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{service.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Bookings:</span>
                      <span className="font-medium">{serviceBookings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-medium">
                        ${serviceBookings
                          .filter(b => b.status === 'COMPLETED')
                          .reduce((sum, b) => sum + (parseFloat(b.totalPrice) || 0), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">${service.price}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Profile Completion Wizard */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ProfileCompletionWizard
                onClose={() => setShowWizard(false)}
                onComplete={() => {
                  setShowWizard(false)
                  setShowPrompt(false)
                  // Refresh page to show updated profile data
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

export default HealerDashboard