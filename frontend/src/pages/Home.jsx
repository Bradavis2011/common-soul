import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  SparklesIcon, 
  HeartIcon, 
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

function Home() {
  const { user } = useAuth()

  const features = [
    {
      icon: SparklesIcon,
      title: "Find Your Healer",
      description: "Browse verified spiritual healers and energy practitioners"
    },
    {
      icon: CalendarDaysIcon,
      title: "Book Sessions",
      description: "Easy scheduling with secure payment processing"
    },
    {
      icon: VideoCameraIcon,
      title: "Video Sessions", 
      description: "Connect via high-quality video calls from anywhere"
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Real-time Messaging",
      description: "Stay connected with your healer between sessions"
    }
  ]

  const testimonials = [
    {
      name: "Sarah M.",
      text: "Found incredible peace through my sessions. Life-changing experience.",
      rating: 5
    },
    {
      name: "Michael R.",
      text: "The platform made it so easy to connect with the right healer for me.",
      rating: 5
    },
    {
      name: "Elena K.",
      text: "Professional, secure, and truly transformative healing sessions.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-800 to-teal-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Your Journey to
              <span className="block bg-gradient-to-r from-teal-200 to-purple-200 bg-clip-text text-transparent">
                Spiritual Healing
              </span>
              <span className="block text-4xl md:text-5xl">Begins Here</span>
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with experienced spiritual healers, energy practitioners, and wellness guides. 
              Transform your life through authentic, personalized healing sessions.
            </p>
            
            {!user ? (
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  to="/register"
                  className="group relative bg-gradient-to-r from-teal-500 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="relative z-10">Start Your Journey</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  to="/discover"
                  className="border-2 border-purple-200 text-purple-100 px-12 py-4 rounded-full text-xl font-semibold hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
                >
                  Explore Healers
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  to="/discover"
                  className="bg-gradient-to-r from-teal-500 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  Find Healers
                </Link>
                <Link
                  to={user.userType === 'healer' ? '/dashboard' : '/customer-dashboard'}
                  className="border-2 border-purple-200 text-purple-100 px-12 py-4 rounded-full text-xl font-semibold hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
                >
                  My Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce delay-1000">
          <SparklesIcon className="h-8 w-8 text-teal-300 opacity-70" />
        </div>
        <div className="absolute top-40 right-20 animate-bounce delay-2000">
          <HeartIcon className="h-12 w-12 text-purple-300 opacity-60" />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Healing Made <span className="text-purple-600">Simple</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform brings together ancient wisdom and modern technology to create 
              the most accessible spiritual healing experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className="bg-gradient-to-br from-purple-500 to-teal-500 rounded-2xl p-4 w-16 h-16 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gradient-to-r from-purple-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Stories of <span className="text-teal-600">Transformation</span>
            </h2>
            <p className="text-xl text-gray-600">Real experiences from our community members</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-500 text-sm">Verified Client</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10"></div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Ready to Begin Your
            <span className="block text-teal-200">Healing Journey?</span>
          </h2>
          <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands who have found peace, clarity, and transformation through our platform.
          </p>
          
          {!user && (
            <Link
              to="/register"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white px-12 py-5 rounded-full text-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <CheckCircleIcon className="h-6 w-6" />
              Start Free Today
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home