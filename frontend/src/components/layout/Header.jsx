import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Common Soul
          </Link>
          <nav className="flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to={user.userType === 'HEALER' ? '/healer/dashboard' : '/customer/dashboard'} 
                  className="text-gray-600 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
                <Link to="/discover" className="text-gray-600 hover:text-indigo-600">
                  Discover
                </Link>
                <Link to="/bookings" className="text-gray-600 hover:text-indigo-600">
                  {user.userType === 'HEALER' ? 'Sessions' : 'Bookings'}
                </Link>
                <Link to="/messages" className="text-gray-600 hover:text-indigo-600">
                  Messages
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-indigo-600">
                  Profile
                </Link>
                <span className="text-sm text-gray-600">
                  Hello, {user.profile?.firstName || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-indigo-600">
                  Login
                </Link>
                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header