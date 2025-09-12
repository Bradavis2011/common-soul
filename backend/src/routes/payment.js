const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// Create checkout session for booking payment
router.post('/create-checkout/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Get booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        healer: {
          include: { profile: true }
        },
        customer: {
          include: { profile: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user is the customer for this booking
    if (booking.customerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to pay for this booking' });
    }

    // Check if booking is in correct status
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Booking is not in payable status' });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId }
    });

    if (existingPayment && existingPayment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Payment already completed for this booking' });
    }

    // Create success and cancel URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const successUrl = `${baseUrl}/bookings?payment=success&booking=${bookingId}`;
    const cancelUrl = `${baseUrl}/bookings?payment=cancelled&booking=${bookingId}`;

    // Create checkout session
    const checkout = await paymentService.createCheckoutSession(
      booking, 
      successUrl, 
      cancelUrl
    );

    // Create or update payment record
    const paymentData = {
      amount: checkout.totalAmount,
      currency: 'USD',
      status: 'PENDING',
      paymentMethod: 'CREDIT_CARD',
      stripeSessionId: checkout.sessionId,
      platformFee: checkout.platformFee,
      healerAmount: checkout.healerAmount,
      metadata: JSON.stringify({
        checkoutSessionId: checkout.sessionId,
        createdAt: new Date().toISOString()
      })
    };

    if (existingPayment) {
      await prisma.payment.update({
        where: { bookingId },
        data: paymentData
      });
    } else {
      await prisma.payment.create({
        data: {
          ...paymentData,
          bookingId
        }
      });
    }

    res.json({
      sessionId: checkout.sessionId,
      url: checkout.url,
      totalAmount: checkout.totalAmount,
      platformFee: checkout.platformFee,
      healerAmount: checkout.healerAmount
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

// Create payment intent for direct payment
router.post('/create-intent/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        healer: true,
        customer: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Booking is not payable' });
    }

    const paymentIntent = await paymentService.createPaymentIntent(booking);

    // Create or update payment record
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId }
    });

    const paymentData = {
      amount: paymentIntent.totalAmount,
      currency: 'USD',
      status: 'PENDING',
      paymentMethod: 'CREDIT_CARD',
      stripePaymentId: paymentIntent.paymentIntentId,
      platformFee: paymentIntent.platformFee,
      healerAmount: paymentIntent.healerAmount,
      metadata: JSON.stringify({
        paymentIntentId: paymentIntent.paymentIntentId,
        createdAt: new Date().toISOString()
      })
    };

    if (existingPayment) {
      await prisma.payment.update({
        where: { bookingId },
        data: paymentData
      });
    } else {
      await prisma.payment.create({
        data: {
          ...paymentData,
          bookingId
        }
      });
    }

    res.json({
      clientSecret: paymentIntent.clientSecret,
      totalAmount: paymentIntent.totalAmount,
      platformFee: paymentIntent.platformFee,
      healerAmount: paymentIntent.healerAmount
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Get payment status for a booking
router.get('/status/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Allow both customer and healer to check payment status
    if (booking.customerId !== userId && booking.healerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            service: true,
            healer: { include: { profile: true } },
            customer: { include: { profile: true } }
          }
        }
      }
    });

    if (!payment) {
      return res.json({
        status: 'NOT_STARTED',
        booking: {
          id: booking.id,
          totalPrice: booking.totalPrice,
          status: booking.status
        }
      });
    }

    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      platformFee: payment.platformFee,
      healerAmount: payment.healerAmount,
      paymentDate: payment.paymentDate,
      refundAmount: payment.refundAmount,
      booking: {
        id: booking.id,
        totalPrice: booking.totalPrice,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    // Validate webhook signature
    const event = paymentService.validateWebhookSignature(req.body, signature);
    
    // Process the webhook event
    const result = await paymentService.handleWebhook(event);
    
    if (result) {
      // Update payment record in database
      await prisma.payment.update({
        where: { bookingId: result.bookingId },
        data: {
          status: result.status,
          stripePaymentId: result.paymentIntentId,
          stripeSessionId: result.sessionId,
          paymentDate: result.paymentDate,
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            webhookProcessedAt: new Date().toISOString(),
            eventType: event.type
          })
        }
      });

      // If payment completed, update booking status and send notification
      if (result.status === 'COMPLETED') {
        const updatedBooking = await prisma.booking.update({
          where: { id: result.bookingId },
          data: { status: 'CONFIRMED' },
          include: {
            service: true,
            healer: { include: { profile: true } },
            customer: { include: { profile: true } }
          }
        });

        // Send payment confirmation emails
        try {
          const payment = await prisma.payment.findUnique({
            where: { bookingId: result.bookingId },
            include: {
              booking: {
                include: {
                  service: true,
                  healer: { include: { profile: true } },
                  customer: { include: { profile: true } }
                }
              }
            }
          });

          if (payment) {
            await emailService.sendPaymentNotification(payment, 'payment_completed');
          }
        } catch (error) {
          console.error('Failed to send payment notification email:', error);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Request refund for a payment
router.post('/refund/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Allow both customer and healer to request refunds
    if (booking.customerId !== userId && booking.healerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!booking.payment) {
      return res.status(400).json({ error: 'No payment found for this booking' });
    }

    if (booking.payment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment not completed, cannot refund' });
    }

    // Process refund through Stripe
    const refund = await paymentService.createRefund(
      booking.payment.stripePaymentId,
      amount,
      reason
    );

    // Update payment record
    await prisma.payment.update({
      where: { bookingId },
      data: {
        status: amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        refundAmount: (booking.payment.refundAmount || 0) + refund.amount,
        refundDate: new Date(),
        metadata: JSON.stringify({
          ...JSON.parse(booking.payment.metadata || '{}'),
          refunds: [
            ...(JSON.parse(booking.payment.metadata || '{}').refunds || []),
            {
              refundId: refund.refundId,
              amount: refund.amount,
              reason: refund.reason,
              date: new Date().toISOString()
            }
          ]
        })
      }
    });

    // Update booking status if fully refunded
    if (!amount || amount >= booking.payment.amount) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });
    }

    // Send refund notification email
    try {
      const updatedPayment = await prisma.payment.findUnique({
        where: { bookingId },
        include: {
          booking: {
            include: {
              service: true,
              healer: { include: { profile: true } },
              customer: { include: { profile: true } }
            }
          }
        }
      });

      if (updatedPayment) {
        await emailService.sendPaymentNotification(updatedPayment, 'refund_processed');
      }
    } catch (error) {
      console.error('Failed to send refund notification email:', error);
    }

    res.json({
      refundId: refund.refundId,
      amount: refund.amount,
      status: refund.status,
      totalRefunded: (booking.payment.refundAmount || 0) + refund.amount
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Create Stripe Connect account for healer
router.post('/connect/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with healer profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            healerProfile: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.userType !== 'HEALER') {
      return res.status(403).json({ error: 'Only healers can create payment accounts' });
    }

    if (!user.profile?.healerProfile) {
      return res.status(400).json({ error: 'Healer profile not found' });
    }

    // Check if already has Stripe Connect account
    if (user.profile.healerProfile.stripeConnectId) {
      return res.status(400).json({ error: 'Payment account already exists' });
    }

    // Create Stripe Connect account
    const account = await paymentService.createConnectAccount(
      user.profile.healerProfile,
      user.email
    );

    // Update healer profile with Stripe account ID
    await prisma.healerProfile.update({
      where: { id: user.profile.healerProfile.id },
      data: {
        stripeConnectId: account.accountId
      }
    });

    res.json({
      accountId: account.accountId,
      status: 'created',
      needsOnboarding: true
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    res.status(500).json({ error: 'Failed to create payment account' });
  }
});

// Create Stripe Connect onboarding link
router.post('/connect/onboarding', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with healer profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            healerProfile: true
          }
        }
      }
    });

    if (!user?.profile?.healerProfile?.stripeConnectId) {
      return res.status(400).json({ error: 'No payment account found' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8084';
    const returnUrl = `${baseUrl}/healer-management?onboarding=complete`;
    const refreshUrl = `${baseUrl}/healer-management?onboarding=refresh`;

    // Create onboarding link
    const link = await paymentService.createAccountLink(
      user.profile.healerProfile.stripeConnectId,
      refreshUrl,
      returnUrl
    );

    res.json({
      url: link.url,
      expires_at: link.expires_at
    });

  } catch (error) {
    console.error('Error creating onboarding link:', error);
    res.status(500).json({ error: 'Failed to create onboarding link' });
  }
});

// Get Stripe Connect account status
router.get('/connect/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with healer profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            healerProfile: true
          }
        }
      }
    });

    if (!user?.profile?.healerProfile) {
      return res.status(400).json({ error: 'Healer profile not found' });
    }

    const stripeConnectId = user.profile.healerProfile.stripeConnectId;
    
    if (!stripeConnectId) {
      return res.json({
        status: 'not_created',
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false
      });
    }

    // Get account status from Stripe
    const accountStatus = await paymentService.getAccountStatus(stripeConnectId);

    res.json({
      status: 'created',
      accountId: accountStatus.id,
      charges_enabled: accountStatus.charges_enabled,
      payouts_enabled: accountStatus.payouts_enabled,
      details_submitted: accountStatus.details_submitted,
      requirements: accountStatus.requirements,
      capabilities: accountStatus.capabilities
    });

  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({ error: 'Failed to get account status' });
  }
});

module.exports = router;