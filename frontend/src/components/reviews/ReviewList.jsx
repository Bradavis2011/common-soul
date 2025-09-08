import { useState, useEffect } from 'react'
import ReviewCard from './ReviewCard'
import { useAuth } from '../../context/AuthContext'

function ReviewList({ healerId, serviceId, showWriteReview = false, onWriteReview }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchReviews()
  }, [healerId, serviceId, pagination.page])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      
      let url
      if (serviceId) {
        url = `${import.meta.env.VITE_API_URL}/reviews/service/${serviceId}`
      } else if (healerId) {
        url = `${import.meta.env.VITE_API_URL}/reviews/healer/${healerId}`
      } else {
        throw new Error('Either healerId or serviceId must be provided')
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      })

      const response = await fetch(`${url}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      
      setReviews(data.reviews || [])
      setStats({
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0
      })
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }))
    } catch (error) {
      console.error('Fetch reviews error:', error)
      setError(error.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToReview = async (reviewId, response) => {
    try {
      const token = localStorage.getItem('token')
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${reviewId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response })
      })

      const data = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(data.error || 'Failed to respond to review')
      }

      // Update the review in the list
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, response: data.response, respondedAt: data.respondedAt }
          : review
      ))
    } catch (error) {
      console.error('Respond to review error:', error)
      alert(error.message || 'Failed to respond to review')
    }
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const renderRatingDistribution = () => {
    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(review => {
      distribution[review.rating]++
    })

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = distribution[rating]
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
          
          return (
            <div key={rating} className="flex items-center text-sm">
              <span className="w-8">{rating}</span>
              <svg className="w-4 h-4 text-yellow-400 fill-current mr-2" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="w-8 text-gray-500">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Reviews ({stats.totalReviews})
            </h3>
            {stats.totalReviews > 0 && (
              <div className="flex items-center">
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-900 mr-2">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-6 h-6 ${
                          star <= Math.round(stats.averageRating) 
                            ? 'text-yellow-400' 
                            : 'text-gray-300'
                        } fill-current`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Write Review Button */}
          {showWriteReview && user?.userType === 'CUSTOMER' && (
            <button
              onClick={onWriteReview}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
            >
              Write Review
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        {stats.totalReviews > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h4>
            {renderRatingDistribution()}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500">
            {showWriteReview && user?.userType === 'CUSTOMER' 
              ? 'Be the first to write a review!' 
              : 'Reviews will appear here once customers start sharing their experiences.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              showServiceInfo={!serviceId}
              onRespond={user?.userType === 'HEALER' && user.id === review.healerId 
                ? (reviewData) => {
                    const response = prompt('Enter your response to this review:')
                    if (response) {
                      handleRespondToReview(reviewData.id, response)
                    }
                  }
                : null
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
              let pageNum
              if (pagination.pages <= 7) {
                pageNum = i + 1
              } else if (pagination.page <= 4) {
                pageNum = i + 1
              } else if (pagination.page >= pagination.pages - 3) {
                pageNum = pagination.pages - 6 + i
              } else {
                pageNum = pagination.page - 3 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-md ${
                    pageNum === pagination.page
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewList