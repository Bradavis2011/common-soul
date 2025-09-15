const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const logger = require('../utils/logger');

class EmailAutomation {
  constructor(database, rateLimiter, config = {}) {
    this.db = database;
    this.rateLimiter = rateLimiter;
    this.config = {
      // SMTP configuration (will be loaded from .env)
      smtp: {
        host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      },

      // Email settings
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Common Soul Team',
        address: process.env.EMAIL_USER
      },

      // Conservative sending limits
      dailyLimit: 25,
      hourlyLimit: 5,
      batchSize: 3,
      batchDelay: 3600000 * 3, // 3 hours between batches

      // Common Soul platform details
      platform: {
        name: 'Common Soul',
        url: 'https://thecommonsoul.com',
        signupUrl: 'https://thecommonsoul.com/register',
        contactEmail: 'hello@thecommonsoul.com'
      },

      // Email templates directory
      templatesDir: './templates',

      ...config
    };

    this.transporter = null;
    this.templates = {};

    this.initializeTransporter();
    this.loadEmailTemplates();
  }

  async initializeTransporter() {
    try {
      if (!this.config.smtp.auth.user || !this.config.smtp.auth.pass) {
        throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file.');
      }

      this.transporter = nodemailer.createTransporter(this.config.smtp);

      // Verify SMTP connection
      await this.transporter.verify();
      logger.info('Email transporter initialized successfully', {
        platform: 'email',
        smtpHost: this.config.smtp.host
      });

    } catch (error) {
      logger.error('Failed to initialize email transporter', error, {
        platform: 'email'
      });
      throw error;
    }
  }

  loadEmailTemplates() {
    try {
      const templatesPath = path.resolve(this.config.templatesDir);

      if (!fs.existsSync(templatesPath)) {
        // Create templates directory with default templates
        fs.mkdirSync(templatesPath, { recursive: true });
        this.createDefaultTemplates();
      }

      // Load all .html templates
      const templateFiles = fs.readdirSync(templatesPath)
        .filter(file => file.endsWith('.html'));

      templateFiles.forEach(file => {
        const templateName = path.basename(file, '.html');
        const templatePath = path.join(templatesPath, file);
        this.templates[templateName] = fs.readFileSync(templatePath, 'utf8');
      });

      logger.info(`Loaded ${Object.keys(this.templates).length} email templates`, {
        platform: 'email',
        templates: Object.keys(this.templates)
      });

    } catch (error) {
      logger.error('Error loading email templates', error, { platform: 'email' });
      // Create basic templates as fallback
      this.createBasicTemplates();
    }
  }

  createDefaultTemplates() {
    const templates = {
      'initial_outreach': this.getInitialOutreachTemplate(),
      'followup_1': this.getFollowup1Template(),
      'followup_2': this.getFollowup2Template(),
      'reiki_master': this.getReikiMasterTemplate(),
      'crystal_healer': this.getCrystalHealerTemplate(),
      'spiritual_coach': this.getSpiritualCoachTemplate(),
      'energy_healer': this.getEnergyHealerTemplate()
    };

    Object.entries(templates).forEach(([name, content]) => {
      const filePath = path.join(this.config.templatesDir, `${name}.html`);
      fs.writeFileSync(filePath, content);
    });

    logger.info('Created default email templates', {
      platform: 'email',
      templateCount: Object.keys(templates).length
    });
  }

  createBasicTemplates() {
    this.templates = {
      'initial_outreach': this.getInitialOutreachTemplate(),
      'followup_1': this.getFollowup1Template()
    };
  }

  async sendOutreachEmail(healer, templateName = 'initial_outreach', customSubject = null) {
    try {
      // Check rate limits
      const rateLimitCheck = await this.rateLimiter.canPerformAction('email', 'outreach');
      if (!rateLimitCheck.allowed) {
        logger.rateLimitHit('email', 'outreach', rateLimitCheck.resetTime);
        return { success: false, reason: 'Rate limit exceeded' };
      }

      // Check manual approval if required
      if (await this.rateLimiter.isManualApprovalRequired()) {
        logger.manualApprovalRequired(healer, 'email_outreach');
        return { success: false, reason: 'Manual approval required' };
      }

      if (!healer.email) {
        return { success: false, reason: 'No email address available' };
      }

      // Get template
      const template = this.templates[templateName];
      if (!template) {
        logger.error(`Email template not found: ${templateName}`, null, {
          platform: 'email',
          templateName
        });
        return { success: false, reason: 'Template not found' };
      }

      // Personalize email content
      const { subject, html, text } = this.personalizeEmail(template, healer, templateName, customSubject);

      // Email options
      const mailOptions = {
        from: `"${this.config.from.name}" <${this.config.from.address}>`,
        to: healer.email,
        subject: subject,
        html: html,
        text: text,
        headers: {
          'X-Mailer': 'Common Soul Healer Discovery Tool',
          'X-Campaign-Type': templateName,
          'X-Healer-ID': healer.id?.toString() || 'unknown'
        }
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      // Log the campaign
      await this.db.logCampaign({
        healer_id: healer.id,
        campaign_type: templateName,
        subject: subject,
        template_used: templateName,
        delivery_status: 'sent'
      });

      // Update healer status
      await this.db.updateHealerStatus(healer.id, 'contacted', `Sent ${templateName} email`);

      // Record the action for rate limiting
      await this.rateLimiter.recordAction('email', 'outreach');

      logger.outreachSent(healer, {
        campaign_type: templateName,
        subject: subject,
        template_used: templateName
      });

      return {
        success: true,
        messageId: result.messageId,
        templateUsed: templateName,
        subject: subject
      };

    } catch (error) {
      logger.outreachError(healer, error);
      return { success: false, reason: error.message };
    }
  }

  personalizeEmail(template, healer, templateName, customSubject = null) {
    // Extract healer information
    const healerName = healer.name || 'Fellow Healer';
    const firstName = healer.name ? healer.name.split(' ')[0] : 'there';
    const specialties = Array.isArray(healer.specialties)
      ? healer.specialties.join(', ')
      : (healer.specialties || 'healing work');
    const location = healer.location || 'your area';
    const platform = healer.source_platform || 'online';

    // Generate subject line
    const subjects = {
      'initial_outreach': [
        `${firstName}, join Common Soul's spiritual healing community`,
        `Invitation for ${firstName} - Common Soul healing platform`,
        `${firstName}, connect with seekers on Common Soul`,
        `Common Soul invitation for ${specialties} practitioners`
      ],
      'followup_1': [
        `Following up on Common Soul opportunity, ${firstName}`,
        `${firstName}, quick question about your healing practice`,
        `Common Soul - still interested, ${firstName}?`
      ],
      'followup_2': [
        `Last invitation to join Common Soul, ${firstName}`,
        `Final opportunity - Common Soul platform`,
        `${firstName}, we'd love to have you on Common Soul`
      ]
    };

    const subjectOptions = subjects[templateName] || subjects['initial_outreach'];
    const subject = customSubject || subjectOptions[Math.floor(Math.random() * subjectOptions.length)];

    // Replace placeholders in template
    let personalizedHtml = template
      .replace(/\{\{healerName\}\}/g, healerName)
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{specialties\}\}/g, specialties)
      .replace(/\{\{location\}\}/g, location)
      .replace(/\{\{platform\}\}/g, platform)
      .replace(/\{\{platformName\}\}/g, this.config.platform.name)
      .replace(/\{\{platformUrl\}\}/g, this.config.platform.url)
      .replace(/\{\{signupUrl\}\}/g, this.config.platform.signupUrl)
      .replace(/\{\{contactEmail\}\}/g, this.config.platform.contactEmail)
      .replace(/\{\{currentDate\}\}/g, moment().format('MMMM YYYY'))
      .replace(/\{\{unsubscribeUrl\}\}/g, `${this.config.platform.url}/unsubscribe?email=${encodeURIComponent(healer.email)}`);

    // Convert HTML to text for text version
    const text = this.htmlToText(personalizedHtml);

    return {
      subject,
      html: personalizedHtml,
      text
    };
  }

  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async batchOutreach(healers, templateName = 'initial_outreach') {
    const results = [];
    const batchSize = this.config.batchSize;

    logger.info(`Starting batch outreach to ${healers.length} healers`, {
      platform: 'email',
      templateName,
      batchSize,
      totalHealers: healers.length
    });

    for (let i = 0; i < healers.length; i += batchSize) {
      const batch = healers.slice(i, i + batchSize);

      logger.info(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(healers.length/batchSize)}`, {
        platform: 'email',
        batchStart: i + 1,
        batchEnd: Math.min(i + batchSize, healers.length)
      });

      // Process batch
      for (const healer of batch) {
        try {
          // Check if we can continue
          const canProceed = await this.rateLimiter.canPerformAction('email', 'outreach');
          if (!canProceed.allowed) {
            logger.rateLimitHit('email', 'outreach', canProceed.resetTime);

            // Add remaining healers as not processed
            const remaining = healers.slice(i + batch.indexOf(healer));
            remaining.forEach(h => {
              results.push({
                healer: h,
                success: false,
                reason: 'Daily limit reached'
              });
            });

            break;
          }

          const result = await this.sendOutreachEmail(healer, templateName);
          results.push({
            healer: healer,
            ...result
          });

          // Delay between individual emails in batch
          if (batch.indexOf(healer) < batch.length - 1) {
            const emailDelay = await this.rateLimiter.getRandomDelay();
            await this.sleep(emailDelay);
          }

        } catch (error) {
          logger.error(`Batch outreach error for healer ${healer.name}`, error);
          results.push({
            healer: healer,
            success: false,
            reason: error.message
          });
        }
      }

      // Delay between batches (if not last batch)
      if (i + batchSize < healers.length) {
        const batchDelay = await this.rateLimiter.getEmailBatchDelay();
        logger.info(`Waiting ${Math.round(batchDelay/1000/60)} minutes before next batch`, {
          platform: 'email',
          delayMinutes: Math.round(batchDelay/1000/60)
        });
        await this.sleep(batchDelay);
      }
    }

    // Generate batch summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info(`Batch outreach complete: ${successful} sent, ${failed} failed`, {
      platform: 'email',
      successful,
      failed,
      totalProcessed: results.length,
      templateUsed: templateName
    });

    return {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        successRate: results.length > 0 ? Math.round((successful / results.length) * 100) : 0
      }
    };
  }

  async getHealersForOutreach(criteria = {}) {
    const defaultCriteria = {
      status: 'discovered',
      min_confidence: 0.6,
      ...criteria
    };

    const healers = await this.db.getHealers(defaultCriteria);

    // Filter for healers with email addresses
    const emailableHealers = healers.filter(h => h.email && h.email.includes('@'));

    // Sort by contact confidence and other factors
    return emailableHealers.sort((a, b) => {
      // Prioritize high confidence contacts
      if (b.contact_confidence !== a.contact_confidence) {
        return b.contact_confidence - a.contact_confidence;
      }

      // Prioritize healers with websites
      if (!!b.website !== !!a.website) {
        return !!b.website - !!a.website;
      }

      // Prioritize recent discoveries
      return new Date(b.discovered_at) - new Date(a.discovered_at);
    });
  }

  async scheduleDailyOutreach() {
    try {
      logger.info('Starting scheduled daily outreach', { platform: 'email' });

      // Check if weekend mode is active
      if (await this.rateLimiter.isWeekendModeActive()) {
        logger.weekendMode(true);
        return { skipped: true, reason: 'Weekend mode active' };
      }

      // Get healers ready for outreach
      const healers = await this.getHealersForOutreach();

      if (healers.length === 0) {
        logger.info('No healers available for outreach', { platform: 'email' });
        return { skipped: true, reason: 'No healers available' };
      }

      // Calculate how many we can contact today
      const progressiveLimit = await this.rateLimiter.getProgressiveLimit();
      const dailyTarget = Math.min(progressiveLimit, this.config.dailyLimit);
      const targetHealers = healers.slice(0, dailyTarget);

      logger.info(`Daily outreach target: ${targetHealers.length} healers`, {
        platform: 'email',
        available: healers.length,
        target: targetHealers.length,
        progressiveLimit
      });

      // Execute batch outreach
      const result = await this.batchOutreach(targetHealers, 'initial_outreach');

      return {
        ...result,
        dailyTarget,
        availableHealers: healers.length
      };

    } catch (error) {
      logger.error('Scheduled daily outreach failed', error, { platform: 'email' });
      throw error;
    }
  }

  // Email template definitions
  getInitialOutreachTemplate() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join Common Soul - Spiritual Healing Platform</title>
    <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #4a5568; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f7fafc; }
        .signature { margin-top: 30px; font-style: italic; color: #718096; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #a0aec0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 Common Soul 🌟</h1>
        <p>Connecting Authentic Healers with Seekers</p>
    </div>

    <div class="content">
        <p>Dear {{firstName}},</p>

        <p>I hope this message finds you in good health and spirit. I came across your beautiful {{specialties}} practice {{platform}} and was deeply inspired by your authentic approach to healing.</p>

        <p>My name is Brandon, and I'm reaching out because I believe you'd be a perfect fit for Common Soul - a new spiritual healing platform that connects authentic practitioners like yourself with seekers who truly value genuine healing experiences.</p>

        <h3>Why Common Soul is Different:</h3>
        <ul>
            <li><strong>Quality Over Quantity:</strong> We carefully vet both healers and seekers to ensure meaningful connections</li>
            <li><strong>Fair Revenue Sharing:</strong> Keep 85% of your session fees - we only take what's needed to maintain the platform</li>
            <li><strong>Complete Support:</strong> Integrated booking, payments, messaging, and video sessions</li>
            <li><strong>Authentic Community:</strong> Connect with like-minded practitioners and build lasting relationships</li>
        </ul>

        <p>We're currently building our founding community of healers in {{location}} and would be honored to have someone with your expertise and integrity join us.</p>

        <a href="{{signupUrl}}" class="button">Learn More About Common Soul</a>

        <p>I'd love to answer any questions you might have about the platform. Feel free to reply to this email or visit our website to explore further.</p>

        <p>With gratitude and light,</p>

        <div class="signature">
            <p>Brandon Davis<br>
            Founder, Common Soul<br>
            {{contactEmail}}<br>
            {{platformUrl}}</p>
        </div>
    </div>

    <div class="footer">
        <p>🌙 Connecting hearts, healing souls 🌙</p>
        <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | {{platformUrl}}</p>
    </div>
</body>
</html>
    `.trim();
  }

  getFollowup1Template() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Following up - Common Soul Platform</title>
    <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #4a5568; max-width: 600px; margin: 0 auto; }
        .content { padding: 30px 20px; background: #f7fafc; }
        .signature { margin-top: 30px; font-style: italic; color: #718096; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #a0aec0; }
    </style>
</head>
<body>
    <div class="content">
        <p>Hello {{firstName}},</p>

        <p>I wanted to follow up on my previous message about Common Soul. I understand that you're likely very busy with your healing practice, and I deeply respect the important work you're doing.</p>

        <p>I'm reaching out again because we've had such positive responses from other {{specialties}} practitioners who've joined our platform. They've shared that Common Soul has helped them:</p>

        <ul>
            <li>Connect with clients who truly value their work</li>
            <li>Streamline their booking and payment processes</li>
            <li>Build a supportive community with fellow healers</li>
        </ul>

        <p>If you're interested in learning more, I'd be happy to answer any questions you might have. Even if now isn't the right time, I'd love to stay connected and support your healing journey in whatever way I can.</p>

        <a href="{{signupUrl}}" class="button">Explore Common Soul</a>

        <p>No pressure at all - just genuine appreciation for the healing work you bring to the world.</p>

        <p>Blessings,</p>

        <div class="signature">
            <p>Brandon<br>
            Common Soul<br>
            {{contactEmail}}</p>
        </div>
    </div>

    <div class="footer">
        <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | {{platformUrl}}</p>
    </div>
</body>
</html>
    `.trim();
  }

  getFollowup2Template() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Last invitation - Common Soul</title>
    <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #4a5568; max-width: 600px; margin: 0 auto; }
        .content { padding: 30px 20px; background: #f7fafc; }
        .signature { margin-top: 30px; font-style: italic; color: #718096; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #a0aec0; }
    </style>
</head>
<body>
    <div class="content">
        <p>Dear {{firstName}},</p>

        <p>This will be my final message about Common Soul. I completely understand if you're not interested or if the timing isn't right - no worries at all.</p>

        <p>I just wanted you to know that the invitation remains open should you ever want to explore joining our community of authentic healers.</p>

        <p>Regardless, I have deep respect for your healing work and the positive impact you're making in people's lives.</p>

        <p>Wishing you continued success and abundant blessings in your practice.</p>

        <div class="signature">
            <p>With gratitude,<br>
            Brandon<br>
            Common Soul</p>
        </div>
    </div>

    <div class="footer">
        <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | {{platformUrl}}</p>
    </div>
</body>
</html>
    `.trim();
  }

  // Specialty-specific templates
  getReikiMasterTemplate() {
    return this.getInitialOutreachTemplate().replace(
      'I came across your beautiful {{specialties}} practice',
      'I came across your Reiki practice and was moved by your dedication to channeling universal life force energy'
    ).replace(
      'someone with your expertise',
      'a gifted Reiki Master like yourself'
    );
  }

  getCrystalHealerTemplate() {
    return this.getInitialOutreachTemplate().replace(
      'I came across your beautiful {{specialties}} practice',
      'I discovered your crystal healing practice and was fascinated by your deep understanding of crystal energies'
    ).replace(
      'someone with your expertise',
      'a knowledgeable crystal healer like yourself'
    );
  }

  getSpiritualCoachTemplate() {
    return this.getInitialOutreachTemplate().replace(
      'I came across your beautiful {{specialties}} practice',
      'I found your spiritual coaching work and was inspired by your commitment to guiding others on their spiritual journey'
    ).replace(
      'someone with your expertise',
      'an experienced spiritual guide like yourself'
    );
  }

  getEnergyHealerTemplate() {
    return this.getInitialOutreachTemplate().replace(
      'I came across your beautiful {{specialties}} practice',
      'I discovered your energy healing practice and was impressed by your intuitive approach to healing'
    ).replace(
      'someone with your expertise',
      'a skilled energy healer like yourself'
    );
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EmailAutomation;