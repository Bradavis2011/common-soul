import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function SimpleHome() {
  return (
    <div className="max-w-6xl mx-auto text-center py-16">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Find Your Path to
        <span className="text-indigo-600"> Spiritual Healing</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Connect with experienced spiritual healers and energy practitioners.
      </p>
      <div className="flex justify-center space-x-4">
        <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors">
          Get Started
        </button>
        <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors">
          Sign In
        </button>
      </div>
    </div>
  )
}

function SimpleApp() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-indigo-600">Common Soul</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<SimpleHome />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default SimpleApp