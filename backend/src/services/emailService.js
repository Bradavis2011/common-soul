const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    try {
      // Configure transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production: Use SMTP service (Gmail, SendGrid, etc.)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      } else {
        // Development: Use Ethereal Email for testing
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      // Verify connection
      await this.transporter.verify();
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendBookingConfirmation(booking) {
    try {
      const { customer, healer, service } = booking;
      const scheduledDate = new Date(booking.scheduledAt);
      
      const customerEmail = {
        from: process.env.EMAIL_FROM || 'noreply@thecommonsoul.com',
        to: customer.email,
        subject: `Booking Confirmed - ${service.title} with ${healer.profile?.firstName || 'Healer'}`,
        html: this.generateBookingConfirmationTemplate(booking, 'customer')
      };

      const healerEmail = {
        from: process.env.EMAIL_FROM || 'noreply@thecommonsoul.com',
        to: healer.email,
        subject: `New Booking - ${service.title} with ${customer.profile?.firstName || 'Customer'}`,
        html: this.generateBookingConfirmationTemplate(booking, 'healer')
      };

      // Send both emails
      const [customerResult, healerResult] = await Promise.all([
        this.transporter.sendMail(customerEmail),
        this.transporter.sendMail(healerEmail)
      ]);

      if (process.env.NODE_ENV !== 'production') {
        console.log('Customer email preview:', nodemailer.getTestMessageUrl(customerResult));
        console.log('Healer email preview:', nodemailer.getTestMessageUrl(healerResult));
      }

      return { success: true, customerResult, healerResult };
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBookingStatusUpdate(booking, oldStatus, newStatus) {
    try {
      const { customer, healer, service } = booking;
      
      // Determine who to notify based on status change
      let recipient, subject, template;
      
      if (newStatus === 'CONFIRMED' && booking.healerId) {
        // Healer confirmed - notify customer
        recipient = customer.email;
        subject = `Booking Confirmed - ${service.title}`;
        template = this.generateStatusUpdateTemplate(booking, 'confirmed', 'customer');
      } else if (newStatus === 'CANCELLED') {
        // Booking cancelled - notify the other party
        const notifyHealer = booking.customerId === booking.updatedBy;
        recipient = notifyHealer ? healer.email : customer.email;
        subject = `Booking Cancelled - ${service.title}`;
        template = this.generateStatusUpdateTemplate(booking, 'cancelled', notifyHealer ? 'healer' : 'customer');
      } else if (newStatus === 'COMPLETED') {
        // Session completed - notify customer
        recipient = customer.email;
        subject = `Session Completed - ${service.title}`;
        template = this.generateStatusUpdateTemplate(booking, 'completed', 'customer');
      }

      if (recipient && subject && template) {
        const result = await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@thecommonsoul.com',
          to: recipient,
          subject,
          html: template
        });

        if (process.env.NODE_ENV !== 'production') {
          console.log('Status update email preview:', nodemailer.getTestMessageUrl(result));
        }

        return { success: true, result };
      }

      return { success: true, message: 'No notification needed for this status change' };
    } catch (error) {
      console.error('Failed to send booking status update email:', error);
      return { success: false, error: error.message };
    }
  }

  generateBookingConfirmationTemplate(booking, recipient) {
    const { customer, healer, service } = booking;
    const scheduledDate = new Date(booking.scheduledAt);
    const formatDate = scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formatTime = scheduledDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const isCustomer = recipient === 'customer';
    const otherParty = isCustomer ? healer : customer;
    const otherPartyName = otherParty.profile?.firstName || (isCustomer ? 'Your healer' : 'Your client');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; max-width: 600px; margin: 0 auto; }
          .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌟 Common Soul</h1>
          <h2>Booking ${isCustomer ? 'Confirmed' : 'Received'}</h2>
        </div>
        
        <div class="content">
          <p>Hello ${(isCustomer ? customer : healer).profile?.firstName || (isCustomer ? 'Dear Customer' : 'Dear Healer')},</p>
          
          <p>${isCustomer 
            ? `Your booking has been confirmed! We're excited for your healing journey with ${otherPartyName}.` 
            : `You have received a new booking request. Please review the details below.`
          }</p>

          <div class="booking-details">
            <h3>📅 Booking Details</h3>
            <div class="detail-row">
              <span class="label">Service:</span>
              <span class="value">${service.title}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${formatDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">${formatTime}</span>
            </div>
            <div class="detail-row">
              <span class="label">Duration:</span>
              <span class="value">${service.duration} minutes</span>
            </div>
            <div class="detail-row">
              <span class="label">${isCustomer ? 'Healer' : 'Client'}:</span>
              <span class="value">${otherPartyName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Total Price:</span>
              <span class="value">$${booking.totalPrice}</span>
            </div>
            ${booking.customerNotes ? `
              <div class="detail-row">
                <span class="label">Notes:</span>
                <span class="value">${booking.customerNotes}</span>
              </div>
            ` : ''}
          </div>

          <p>
            <a href="${process.env.FRONTEND_URL || 'https://thecommonsoul.com'}/bookings/${booking.id}" class="button">
              View Booking Details
            </a>
          </p>

          ${isCustomer ? `
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>You'll receive a confirmation once your healer accepts the booking</li>
              <li>We'll send you a reminder 24 hours before your session</li>
              <li>You can message your healer anytime through our platform</li>
            </ul>
          ` : `
            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Please confirm this booking to proceed</li>
              <li>You can message your client to discuss the session</li>
              <li>Prepare any materials needed for the healing session</li>
            </ul>
          `}
        </div>

        <div class="footer">
          <p>Thank you for choosing Common Soul for your spiritual healing journey.</p>
          <p>Need help? Contact us at support@thecommonsoul.com</p>
          <p>🌟 <em>Connecting hearts, healing souls</em> 🌟</p>
        </div>
      </body>
      </html>
    `;
  }

  generateStatusUpdateTemplate(booking, status, recipient) {
    const { customer, healer, service } = booking;
    const scheduledDate = new Date(booking.scheduledAt);
    const formatDate = scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formatTime = scheduledDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const isCustomer = recipient === 'customer';
    const userName = (isCustomer ? customer : healer).profile?.firstName || (isCustomer ? 'Dear Customer' : 'Dear Healer');

    let statusMessage, statusColor, nextSteps;
    
    switch (status) {
      case 'confirmed':
        statusMessage = 'Your booking has been confirmed!';
        statusColor = '#28a745';
        nextSteps = `
          <ul>
            <li>We'll send you a reminder 24 hours before your session</li>
            <li>You can prepare any questions or intentions for your session</li>
            <li>Check your email for session details closer to the date</li>
          </ul>
        `;
        break;
      case 'cancelled':
        statusMessage = 'Your booking has been cancelled.';
        statusColor = '#dc3545';
        nextSteps = `
          <ul>
            <li>If payment was processed, you'll receive a refund within 3-5 business days</li>
            <li>You can book another session anytime</li>
            <li>Contact support if you have any questions</li>
          </ul>
        `;
        break;
      case 'completed':
        statusMessage = 'Your healing session has been completed.';
        statusColor = '#6f42c1';
        nextSteps = `
          <ul>
            <li>Take time to integrate your healing experience</li>
            <li>Consider leaving a review to help other seekers</li>
            <li>You can book follow-up sessions anytime</li>
          </ul>
        `;
        break;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; max-width: 600px; margin: 0 auto; }
          .status-banner { background: ${statusColor}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌟 Common Soul</h1>
          <h2>Booking Update</h2>
        </div>
        
        <div class="content">
          <p>Hello ${userName},</p>
          
          <div class="status-banner">
            <h3>${statusMessage}</h3>
          </div>

          <div class="booking-details">
            <h3>📅 Booking Details</h3>
            <div class="detail-row">
              <span class="label">Service:</span>
              <span class="value">${service.title}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${formatDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">${formatTime}</span>
            </div>
            ${booking.cancellationReason ? `
              <div class="detail-row">
                <span class="label">Reason:</span>
                <span class="value">${booking.cancellationReason}</span>
              </div>
            ` : ''}
          </div>

          <p>
            <a href="${process.env.FRONTEND_URL || 'https://thecommonsoul.com'}/bookings/${booking.id}" class="button">
              View Booking Details
            </a>
          </p>

          <p><strong>What's Next?</strong></p>
          ${nextSteps}
        </div>

        <div class="footer">
          <p>Thank you for choosing Common Soul for your spiritual healing journey.</p>
          <p>Need help? Contact us at support@thecommonsoul.com</p>
          <p>🌟 <em>Connecting hearts, healing souls</em> 🌟</p>
        </div>
      </body>
      </html>
    `;
  }

  async sendPaymentNotification(payment, type) {
    try {
      const { booking } = payment;
      const { customer, healer, service } = booking;
      
      let subject, template;
      
      switch (type) {
        case 'payment_completed':
          // Notify both customer and healer
          const customerPaymentEmail = {
            from: process.env.EMAIL_FROM || 'noreply@thecommonsoul.com',
            to: customer.email,
            subject: `Payment Confirmed - ${service.title}`,
            html: this.generatePaymentNotificationTemplate(payment, 'completed', 'customer')
          };

          const healerPaymentEmail = {
            from: process.env.EMAIL_FROM || 'noreply@thecommonsoul.com',
            to: healer.email,
            subject: `Payment Received - ${service.title}`,
            html: this.generatePaymentNotificationTemplate(payment, 'completed', 'healer')
          };

          const [customerResult, healerResult] = await Promise.all([
            this.transporter.sendMail(customerPaymentEmail),
            this.transporter.sendMail(healerPaymentEmail)
          ]);

          if (process.env.NODE_ENV !== 'production') {
            console.log('Customer payment email preview:', nodemailer.getTestMessageUrl(customerResult));
            console.log('Healer payment email preview:', nodemailer.getTestMessageUrl(healerResult));
          }

          return { success: true, customerResult, healerResult };

        case 'refund_processed':
          subject = `Refund Processed - ${service.title}`;
          template = this.generatePaymentNotificationTemplate(payment, 'refund', 'customer');
          
          const refundResult = await this.transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@thecommonsoul.com',
            to: customer.email,
            subject,
            html: template
          });

          if (process.env.NODE_ENV !== 'production') {
            console.log('Refund email preview:', nodemailer.getTestMessageUrl(refundResult));
          }

          return { success: true, result: refundResult };
      }

      return { success: false, error: 'Unknown payment notification type' };
    } catch (error) {
      console.error('Failed to send payment notification email:', error);
      return { success: false, error: error.message };
    }
  }

  generatePaymentNotificationTemplate(payment, type, recipient) {
    const { booking } = payment;
    const { customer, healer, service } = booking;
    const isCustomer = recipient === 'customer';
    const userName = (isCustomer ? customer : healer).profile?.firstName || (isCustomer ? 'Dear Customer' : 'Dear Healer');

    let headerText, messageText, statusColor, nextSteps;

    switch (type) {
      case 'completed':
        if (isCustomer) {
          headerText = 'Payment Confirmed';
          messageText = `Your payment of $${payment.amount} for ${service.title} has been successfully processed.`;
          statusColor = '#28a745';
          nextSteps = `
            <ul>
              <li>Your booking is now confirmed and secured</li>
              <li>You'll receive a session reminder 24 hours before your appointment</li>
              <li>You can message your healer anytime through our platform</li>
            </ul>
          `;
        } else {
          headerText = 'Payment Received';
          messageText = `Payment of $${payment.healerAmount || payment.amount} has been received for your ${service.title} session.`;
          statusColor = '#28a745';
          nextSteps = `
            <ul>
              <li>The session is now confirmed with your client</li>
              <li>Funds will be transferred to your account according to our payout schedule</li>
              <li>Prepare any materials needed for the healing session</li>
            </ul>
          `;
        }
        break;

      case 'refund':
        headerText = 'Refund Processed';
        messageText = `Your refund of $${payment.refundAmount || payment.amount} has been processed and will appear in your account within 3-5 business days.`;
        statusColor = '#17a2b8';
        nextSteps = `
          <ul>
            <li>Refund will appear on your original payment method</li>
            <li>You can book another session anytime</li>
            <li>Contact support if you don't see the refund within 5 business days</li>
          </ul>
        `;
        break;
    }

    const scheduledDate = new Date(booking.scheduledAt);
    const formatDate = scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formatTime = scheduledDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; max-width: 600px; margin: 0 auto; }
          .status-banner { background: ${statusColor}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .payment-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌟 Common Soul</h1>
          <h2>${headerText}</h2>
        </div>
        
        <div class="content">
          <p>Hello ${userName},</p>
          
          <div class="status-banner">
            <h3>💳 ${messageText}</h3>
          </div>

          <div class="payment-details">
            <h3>💰 Payment Details</h3>
            <div class="detail-row">
              <span class="label">Service:</span>
              <span class="value">${service.title}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount ${type === 'refund' ? 'Refunded' : 'Paid'}:</span>
              <span class="value">$${type === 'refund' ? (payment.refundAmount || payment.amount) : payment.amount}</span>
            </div>
            ${payment.platformFee && type !== 'refund' ? `
              <div class="detail-row">
                <span class="label">Platform Fee:</span>
                <span class="value">$${payment.platformFee}</span>
              </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Payment Method:</span>
              <span class="value">${payment.paymentMethod || 'Credit Card'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Session Date:</span>
              <span class="value">${formatDate} at ${formatTime}</span>
            </div>
            <div class="detail-row">
              <span class="label">Transaction Date:</span>
              <span class="value">${(payment.paymentDate || payment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <p>
            <a href="${process.env.FRONTEND_URL || 'https://thecommonsoul.com'}/bookings/${booking.id}" class="button">
              View Booking Details
            </a>
          </p>

          <p><strong>What's Next?</strong></p>
          ${nextSteps}
        </div>

        <div class="footer">
          <p>Thank you for choosing Common Soul for your spiritual healing journey.</p>
          <p>Need help? Contact us at support@thecommonsoul.com</p>
          <p>🌟 <em>Connecting hearts, healing souls</em> 🌟</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();