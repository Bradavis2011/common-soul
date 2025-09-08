import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { user } = useAuth()

  return (
    <div className="max-w-6xl mx-auto text-center py-16">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Find Your Path to
        <span className="text-indigo-600"> Spiritual Healing</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Connect with experienced spiritual healers and energy practitioners.
      </p>
      
      {!user && (
        <div className="flex justify-center space-x-4">
          <Link
            to="/register"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  )
}

export default Home