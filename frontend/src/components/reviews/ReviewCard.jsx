import { useState } from 'react'

const StarRating = ({ rating, size = 'small' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          } fill-current`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating}/5
      </span>
    </div>
  )
}

function ReviewCard({ review, showServiceInfo = false, onRespond }) {
  const [showFullComment, setShowFullComment] = useState(false)
  const [showResponse, setShowResponse] = useState(false)

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text
    return showFullComment ? text : `${text.substring(0, maxLength)}...`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
            {review.customer?.profile?.avatarUrl ? (
              <img 
                src={review.customer.profile.avatarUrl} 
                alt="Customer"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-400">
                {review.customer?.profile?.firstName?.[0]}
                {review.customer?.profile?.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {review.customer?.profile?.firstName} {review.customer?.profile?.lastName}
            </div>
            <div className="flex items-center space-x-2">
              <StarRating rating={review.rating} />
              {review.isVerified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {formatDate(review.createdAt)}
          </div>
          {showServiceInfo && review.service && (
            <div className="text-xs text-gray-400 mt-1">
              {review.service.title}
            </div>
          )}
        </div>
      </div>

      {review.title && (
        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
      )}

      {review.comment && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {truncateText(review.comment)}
          </p>
          {review.comment.length > 150 && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-1"
            >
              {showFullComment ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>
      )}

      {/* Healer Response */}
      {review.response && (
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-900 text-sm">
              Response from Healer
            </div>
            {review.respondedAt && (
              <div className="text-xs text-gray-500">
                {formatDate(review.respondedAt)}
              </div>
            )}
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {review.response}
          </p>
        </div>
      )}

      {/* Response Button for Healers */}
      {onRespond && !review.response && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => onRespond(review)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Respond to Review
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewCard
export { StarRating }