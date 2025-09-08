import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SparklesIcon, UserCircleIcon } from '@heroicons/react/24/outline'

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-purple-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-r from-purple-600 to-teal-600 rounded-xl p-2 group-hover:scale-110 transition-transform duration-200">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                Common Soul
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Spiritual Healing Platform</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            {user ? (
              <div className="flex items-center space-x-6">
                <Link 
                  to={user.userType === 'healer' ? '/dashboard' : '/customer-dashboard'} 
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 relative group"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-teal-600 group-hover:w-full transition-all duration-200"></span>
                </Link>
                <Link 
                  to="/discover" 
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 relative group"
                >
                  Discover
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-teal-600 group-hover:w-full transition-all duration-200"></span>
                </Link>
                <Link 
                  to="/bookings" 
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 relative group"
                >
                  {user.userType === 'healer' ? 'Sessions' : 'Bookings'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-teal-600 group-hover:w-full transition-all duration-200"></span>
                </Link>
                <Link 
                  to="/messages" 
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 relative group"
                >
                  Messages
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-teal-600 group-hover:w-full transition-all duration-200"></span>
                </Link>
                
                <div className="flex items-center gap-4 ml-6">
                  <Link 
                    to="/profile"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-teal-50 hover:from-purple-100 hover:to-teal-100 px-4 py-2 rounded-full transition-all duration-200 border border-purple-100"
                  >
                    {user.profile?.avatarUrl ? (
                      <img 
                        src={user.profile.avatarUrl} 
                        alt={user.profile?.firstName} 
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-purple-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {user.profile?.firstName || user.email?.split('@')[0]}
                    </span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 transform hover:scale-105"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/discover" 
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200"
                >
                  Explore
                </Link>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 transform hover:scale-105"
                >
                  Start Journey
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button - you could expand this later */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-purple-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header