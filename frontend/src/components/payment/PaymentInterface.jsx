import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { CreditCardIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Card form component for direct payments
function CardPaymentForm({ booking, onSuccess, onError, loading, setLoading }) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardError, setCardError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    const card = elements.getElement(CardElement)

    setLoading(true)
    setCardError('')

    try {
      // Create payment intent
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-intent/${booking.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: `${booking.customer.profile?.firstName} ${booking.customer.profile?.lastName}`,
            email: booking.customer.email
          }
        }
      })

      if (result.error) {
        setCardError(result.error.message)
      } else {
        onSuccess(result.paymentIntent)
      }
    } catch (error) {
      onError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, sans-serif',
        fontSmoothing: 'antialiased',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Card Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement
            options={cardElementOptions}
            onChange={(event) => setCardError(event.error ? event.error.message : '')}
          />
        </div>
        {cardError && (
          <p className="mt-2 text-sm text-red-600">{cardError}</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <LockClosedIcon className="h-4 w-4" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg text-white font-semibold ${
          loading || !stripe
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        } transition-colors`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <LockClosedIcon className="h-4 w-4" />
            <span>Pay ${booking.totalPrice}</span>
          </>
        )}
      </button>
    </form>
  )
}

// Main payment interface component
function PaymentInterface({ booking, onSuccess, onCancel }) {
  const [paymentMethod, setPaymentMethod] = useState('checkout') // 'checkout' or 'card'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckoutPayment = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-checkout/${booking.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handlePaymentSuccess = (paymentIntent) => {
    onSuccess({
      type: 'card',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    })
  }

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage)
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const { date, time } = formatDateTime(booking.scheduledAt)

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600">
        <h2 className="text-2xl font-bold text-white">Complete Your Payment</h2>
        <p className="text-green-100 mt-1">Secure payment powered by Stripe</p>
      </div>

      <div className="p-6">
        {/* Booking Summary */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{booking.service?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Healer:</span>
              <span className="font-medium">
                {booking.healer?.profile?.firstName} {booking.healer?.profile?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium">{date} at {time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{booking.duration} minutes</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-green-600">${booking.totalPrice}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Choose Payment Method</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('checkout')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'checkout'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                <div className="text-left">
                  <div className="font-medium">Stripe Checkout</div>
                  <div className="text-sm text-gray-600">Secure hosted payment page</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'card'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCardIcon className="h-6 w-6 text-indigo-600" />
                <div className="text-left">
                  <div className="font-medium">Credit Card</div>
                  <div className="text-sm text-gray-600">Pay directly with your card</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Form */}
        {paymentMethod === 'checkout' ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                You'll be redirected to Stripe's secure checkout page to complete your payment.
              </p>
            </div>
            <button
              onClick={handleCheckoutPayment}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg text-white font-semibold ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } transition-colors`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating session...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Pay with Stripe Checkout</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <CardPaymentForm
              booking={booking}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              loading={loading}
              setLoading={setLoading}
            />
          </Elements>
        )}

        {/* Security Information */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <LockClosedIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Secure Payment</span>
          </div>
          <p className="text-sm text-gray-600">
            Your payment is processed securely by Stripe. We never store your credit card information.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentInterface