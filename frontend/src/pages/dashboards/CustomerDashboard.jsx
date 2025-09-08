import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

function CustomerDashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.profile?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">Discover healers and book your next session</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
          <p className="text-2xl font-bold text-indigo-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900">Completed Sessions</h3>
          <p className="text-2xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900">Favorite Healers</h3>
          <p className="text-2xl font-bold text-purple-600">0</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Discover Healing</h2>
        <div className="space-y-3">
          <Link to="/discover" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 block">
            <div className="font-medium text-gray-900">Browse All Healers</div>
            <div className="text-sm text-gray-500">Explore our network of spiritual healers</div>
          </Link>
          <Link to="/discover" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 block">
            <div className="font-medium text-gray-900">Book a Session</div>
            <div className="text-sm text-gray-500">Schedule your next healing appointment</div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CustomerDashboard