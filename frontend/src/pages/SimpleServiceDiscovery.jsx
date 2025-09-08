function SimpleServiceDiscovery() {
  const mockServices = [
    {
      id: 1,
      title: "Reiki Healing Session",
      description: "60-minute energy healing session",
      price: 75,
      healer: { name: "Sarah Johnson" }
    },
    {
      id: 2,
      title: "Chakra Alignment",
      description: "Balance your energy centers",
      price: 90,
      healer: { name: "Michael Chen" }
    },
    {
      id: 3,
      title: "Meditation Guidance",
      description: "Personalized meditation coaching",
      price: 60,
      healer: { name: "Emma Wilson" }
    }
  ]

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Discover Healing Services</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockServices.map(service => (
          <div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
            <p className="text-gray-600 mb-4">{service.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-indigo-600">${service.price}</span>
              <span className="text-sm text-gray-500">by {service.healer.name}</span>
            </div>
            <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors">
              Book Now
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimpleServiceDiscovery