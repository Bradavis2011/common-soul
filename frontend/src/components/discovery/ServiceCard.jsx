const CATEGORY_LABELS = {
  'REIKI_HEALING': 'Reiki Healing',
  'ENERGY_HEALING': 'Energy Healing',
  'SPIRITUAL_COUNSELING': 'Spiritual Counseling',
  'CHAKRA_ALIGNMENT': 'Chakra Alignment',
  'TAROT_READING': 'Tarot Reading',
  'MEDITATION_GUIDANCE': 'Meditation Guidance',
  'CRYSTAL_HEALING': 'Crystal Healing',
  'AURA_CLEANSING': 'Aura Cleansing',
  'SOUND_HEALING': 'Sound Healing',
  'BREATHWORK': 'Breathwork',
  'ASTROLOGY': 'Astrology',
  'NUMEROLOGY': 'Numerology'
}

function ServiceCard({ service, onBook, onViewHealer }) {
  const healer = service.healer
  const healerProfile = healer?.profile
  const healerInfo = healerProfile?.healerProfile
  
  // Calculate average rating from reviews
  const averageRating = service.reviews && service.reviews.length > 0 
    ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / service.reviews.length 
    : 0
  const reviewCount = service.reviews ? service.reviews.length : 0

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            } fill-current`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">
          {rating > 0 ? rating.toFixed(1) : 'No reviews'}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {service.imageUrl && (
        <img 
          src={service.imageUrl} 
          alt={service.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {service.title}
          </h3>
          <div className="text-right ml-4">
            <div className="text-xl font-bold text-indigo-600">${service.price}</div>
            <div className="text-sm text-gray-500">{service.duration} min</div>
          </div>
        </div>

        <p className="text-sm text-indigo-600 mb-2">
          {CATEGORY_LABELS[service.category]}
        </p>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {service.description}
        </p>

        {/* Reviews and Rating */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {renderStars(averageRating)}
          </div>
          <div className="text-sm text-gray-500">
            {reviewCount} review{reviewCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Healer Info */}
        <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
            {healerProfile?.avatarUrl ? (
              <img 
                src={healerProfile.avatarUrl} 
                alt="Healer"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-400">
                {healerProfile?.firstName?.[0]}{healerProfile?.lastName?.[0]}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {healerProfile?.firstName} {healerProfile?.lastName}
            </div>
            {healerInfo?.yearsExperience && (
              <div className="text-sm text-gray-500">
                {healerInfo.yearsExperience} years experience
              </div>
            )}
          </div>
          <button
            onClick={() => onViewHealer(healer.id)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            View Profile
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => onBook(service)}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            Book Session
          </button>
          <button
            onClick={() => onViewHealer(healer.id)}
            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
          >
            View Healer
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServiceCard