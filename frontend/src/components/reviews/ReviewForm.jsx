import { useState } from 'react'
import { StarRating } from './ReviewCard'

function ReviewForm({ healer, service, booking, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    isPublic: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }))
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.rating < 1 || formData.rating > 5) {
      setError('Please select a rating between 1 and 5 stars')
      setLoading(false)
      return
    }

    if (formData.comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          healerId: healer.id,
          serviceId: service?.id,
          bookingId: booking?.id,
          ...formData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      onSubmit(data)
    } catch (error) {
      console.error('Submit review error:', error)
      setError(error.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  const StarSelector = ({ rating, onRatingChange }) => {
    const [hoverRating, setHoverRating] = useState(0)

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-colors"
          >
            <svg
              className={`w-8 h-8 ${
                star <= (hoverRating || rating) 
                  ? 'text-yellow-400' 
                  : 'text-gray-300'
              } fill-current hover:text-yellow-400`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        <span className="ml-3 text-sm text-gray-600">
          {formData.rating} star{formData.rating !== 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Write a Review
        </h3>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
              {healer.profile?.avatarUrl ? (
                <img 
                  src={healer.profile.avatarUrl} 
                  alt="Healer"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-gray-400">
                  {healer.profile?.firstName?.[0]}
                  {healer.profile?.lastName?.[0]}
                </span>
              )}
            </div>
            <span className="font-medium">
              {healer.profile?.firstName} {healer.profile?.lastName}
            </span>
          </div>
          {service && (
            <>
              <span>•</span>
              <span>{service.title}</span>
            </>
          )}
          {booking && (
            <>
              <span>•</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                ✓ Verified Session
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <StarSelector rating={formData.rating} onRatingChange={handleRatingChange} />
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title (Optional)
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Summarize your experience..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            maxLength={100}
          />
        </div>

        {/* Review Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Share your experience with this healer and their service. What did you like? How did the session help you?"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            required
            minLength={10}
            maxLength={2000}
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.comment.length}/2000 characters
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isPublic"
            id="isPublic"
            checked={formData.isPublic}
            onChange={handleInputChange}
            className="mr-2 rounded text-indigo-600"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-700">
            Make this review public (visible to other users)
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading || formData.comment.trim().length < 10}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Guidelines */}
      <div className="mt-6 p-3 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Review Guidelines:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Be honest and specific about your experience</li>
          <li>• Focus on the service quality and healer's professionalism</li>
          <li>• Avoid sharing personal health details</li>
          <li>• Keep your language respectful and constructive</li>
          <li>• You can edit your review later if needed</li>
        </ul>
      </div>
    </div>
  )
}

export default ReviewForm