const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

class PaymentService {
  constructor() {
    this.platformFeePercentage = 0.10; // 10% platform fee
  }

  // Check if Stripe is configured
  isStripeConfigured() {
    return !!stripe;
  }

  // Throw error if Stripe not configured
  requireStripe() {
    if (!this.isStripeConfigured()) {
      throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
  }

  // Calculate platform fee and healer amount
  calculateAmounts(totalAmount) {
    const platformFee = Math.round(totalAmount * this.platformFeePercentage * 100) / 100;
    const healerAmount = Math.round((totalAmount - platformFee) * 100) / 100;
    
    return {
      totalAmount,
      platformFee,
      healerAmount
    };
  }

  // Create Stripe checkout session for booking payment
  async createCheckoutSession(booking, successUrl, cancelUrl) {
    this.requireStripe();
    try {
      const { totalAmount, platformFee, healerAmount } = this.calculateAmounts(booking.totalPrice);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Healing Session: ${booking.service.title}`,
                description: `${booking.duration} minute session with ${booking.healer.profile?.firstName} ${booking.healer.profile?.lastName}`,
                images: booking.service.imageUrl ? [booking.service.imageUrl] : [],
              },
              unit_amount: Math.round(totalAmount * 100), // Stripe expects cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          bookingId: booking.id,
          customerId: booking.customerId,
          healerId: booking.healerId,
          serviceId: booking.serviceId,
          platformFee: platformFee.toString(),
          healerAmount: healerAmount.toString()
        },
        customer_email: booking.customer.email,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      });

      return {
        sessionId: session.id,
        url: session.url,
        ...this.calculateAmounts(totalAmount)
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create payment session');
    }
  }

  // Create payment intent for direct payment
  async createPaymentIntent(booking) {
    this.requireStripe();
    try {
      const { totalAmount, platformFee, healerAmount } = this.calculateAmounts(booking.totalPrice);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Stripe expects cents
        currency: 'usd',
        metadata: {
          bookingId: booking.id,
          customerId: booking.customerId,
          healerId: booking.healerId,
          serviceId: booking.serviceId,
          platformFee: platformFee.toString(),
          healerAmount: healerAmount.toString()
        },
        description: `Healing Session: ${booking.service.title}`,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        ...this.calculateAmounts(totalAmount)
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  // Process webhook from Stripe
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          return await this.handleCheckoutCompleted(event.data.object);
        
        case 'payment_intent.succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
        
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return null;
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Handle successful checkout session
  async handleCheckoutCompleted(session) {
    const bookingId = session.metadata.bookingId;
    const platformFee = parseFloat(session.metadata.platformFee);
    const healerAmount = parseFloat(session.metadata.healerAmount);

    return {
      bookingId,
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      amount: session.amount_total / 100, // Convert from cents
      platformFee,
      healerAmount,
      currency: session.currency,
      status: 'COMPLETED',
      paymentDate: new Date()
    };
  }

  // Handle successful payment intent
  async handlePaymentSucceeded(paymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;
    const platformFee = parseFloat(paymentIntent.metadata.platformFee);
    const healerAmount = parseFloat(paymentIntent.metadata.healerAmount);

    return {
      bookingId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      platformFee,
      healerAmount,
      currency: paymentIntent.currency,
      status: 'COMPLETED',
      paymentDate: new Date()
    };
  }

  // Handle failed payment
  async handlePaymentFailed(paymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    return {
      bookingId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: 'FAILED',
      failureReason: paymentIntent.last_payment_error?.message
    };
  }

  // Create refund
  async createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
    this.requireStripe();
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
        reason: reason
      });

      return {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        reason: refund.reason
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  // Get payment details from Stripe
  async getPaymentDetails(paymentIntentId) {
    this.requireStripe();
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethod: paymentIntent.charges.data[0]?.payment_method_details?.type,
        created: new Date(paymentIntent.created * 1000)
      };
    } catch (error) {
      console.error('Error retrieving payment details:', error);
      throw new Error('Failed to retrieve payment details');
    }
  }

  // Validate webhook signature
  validateWebhookSignature(body, signature) {
    this.requireStripe();
    try {
      const event = stripe.webhooks.constructEvent(
        body, 
        signature, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }
}

module.exports = new PaymentService();