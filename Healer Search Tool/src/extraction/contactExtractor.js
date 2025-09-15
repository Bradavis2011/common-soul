const axios = require('axios');
const cheerio = require('cheerio');
const validator = require('validator');
const logger = require('../utils/logger');

class ContactExtractor {
  constructor(database, rateLimiter, config = {}) {
    this.db = database;
    this.rateLimiter = rateLimiter;
    this.config = {
      // Email validation settings
      emailValidation: {
        allowSmtpDomainCheck: true,
        allowFreemail: true // Allow Gmail, Yahoo, etc. as many healers use these
      },

      // Phone number patterns
      phonePatterns: [
        /\b(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g, // US
        /\b(\+?1[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g, // US alt
        /\b\+?(\d{1,3})[-.\s]?(\d{3,4})[-.\s]?(\d{3,4})[-.\s]?(\d{3,4})\b/g // International
      ],

      // Email patterns (comprehensive)
      emailPatterns: [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // With spaces
        /\b[A-Za-z0-9._%+-]+\(at\)[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // (at) format
        /\b[A-Za-z0-9._%+-]+\s*at\s*[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi // at format
      ],

      // Request settings
      timeout: 15000,
      maxRedirects: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',

      ...config
    };

    // Initialize axios with defaults
    this.client = axios.create({
      timeout: this.config.timeout,
      maxRedirects: this.config.maxRedirects,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    });
  }

  async extractContactsFromWebsite(url) {
    try {
      logger.info(`Extracting contacts from website: ${url}`, {
        platform: 'website',
        action: 'contact_extraction',
        url
      });

      // Check rate limits
      const rateLimitCheck = await this.rateLimiter.canPerformAction('website', 'scraping');
      if (!rateLimitCheck.allowed) {
        logger.rateLimitHit('website', 'scraping', rateLimitCheck.resetTime);
        return { emails: [], phones: [] };
      }

      // Fetch the webpage
      const response = await this.client.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      // Extract emails and phones
      const emails = this.extractEmails(html);
      const phones = this.extractPhones(html);

      // Also check specific contact page if exists
      const contactPageData = await this.checkContactPage($, url);
      if (contactPageData.emails.length || contactPageData.phones.length) {
        emails.push(...contactPageData.emails);
        phones.push(...contactPageData.phones);
      }

      // Remove duplicates and validate
      const uniqueEmails = [...new Set(emails)];
      const uniquePhones = [...new Set(phones)];

      const validatedEmails = await this.validateEmails(uniqueEmails);
      const formattedPhones = this.formatPhones(uniquePhones);

      // Record the action
      await this.rateLimiter.recordAction('website', 'scraping');

      logger.info(`Contact extraction complete: ${validatedEmails.length} emails, ${formattedPhones.length} phones`, {
        platform: 'website',
        action: 'contact_extraction',
        url,
        emailCount: validatedEmails.length,
        phoneCount: formattedPhones.length
      });

      return {
        emails: validatedEmails,
        phones: formattedPhones
      };

    } catch (error) {
      logger.error(`Error extracting contacts from ${url}`, error, {
        platform: 'website',
        url
      });
      return { emails: [], phones: [] };
    }
  }

  extractEmails(html) {
    const emails = [];

    // Clean HTML to handle obfuscated emails
    let cleanHtml = html
      .replace(/\(at\)/gi, '@')
      .replace(/\[at\]/gi, '@')
      .replace(/\s*at\s*/gi, '@')
      .replace(/\(dot\)/gi, '.')
      .replace(/\[dot\]/gi, '.')
      .replace(/\s*dot\s*/gi, '.');

    // Apply all email patterns
    this.config.emailPatterns.forEach(pattern => {
      const matches = cleanHtml.match(pattern);
      if (matches) {
        emails.push(...matches);
      }
    });

    // Clean up extracted emails
    return emails
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0 && email.includes('@'))
      .filter(email => !this.isBlacklistedEmail(email));
  }

  extractPhones(html) {
    const phones = [];

    // Remove HTML tags for better pattern matching
    const textContent = html.replace(/<[^>]*>/g, ' ');

    this.config.phonePatterns.forEach(pattern => {
      const matches = textContent.match(pattern);
      if (matches) {
        phones.push(...matches);
      }
    });

    return phones
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0);
  }

  async checkContactPage($, baseUrl) {
    try {
      // Look for contact page links
      const contactLinks = [];

      $('a').each((i, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().toLowerCase();

        if (href && (
          text.includes('contact') ||
          text.includes('get in touch') ||
          text.includes('reach out') ||
          href.includes('contact') ||
          href.includes('about')
        )) {
          const fullUrl = this.resolveUrl(href, baseUrl);
          if (fullUrl && fullUrl !== baseUrl) {
            contactLinks.push(fullUrl);
          }
        }
      });

      // Try the first contact page found
      if (contactLinks.length > 0) {
        const contactUrl = contactLinks[0];

        try {
          const response = await this.client.get(contactUrl);
          const contactHtml = response.data;

          const emails = this.extractEmails(contactHtml);
          const phones = this.extractPhones(contactHtml);

          logger.debug(`Found contact page: ${contactUrl} with ${emails.length} emails, ${phones.length} phones`, {
            platform: 'website',
            contactUrl
          });

          return { emails, phones };

        } catch (error) {
          logger.debug(`Could not fetch contact page: ${contactUrl}`, {
            platform: 'website',
            error: error.message
          });
        }
      }

      return { emails: [], phones: [] };

    } catch (error) {
      logger.error('Error checking contact page', error, { platform: 'website' });
      return { emails: [], phones: [] };
    }
  }

  resolveUrl(href, baseUrl) {
    try {
      if (href.startsWith('http')) {
        return href;
      }

      const base = new URL(baseUrl);

      if (href.startsWith('/')) {
        return `${base.protocol}//${base.host}${href}`;
      }

      return `${base.protocol}//${base.host}/${href}`;

    } catch (error) {
      return null;
    }
  }

  async validateEmails(emails) {
    const validatedEmails = [];

    for (const email of emails) {
      try {
        // Basic format validation
        if (!validator.isEmail(email)) {
          continue;
        }

        // Check against common fake/placeholder emails
        if (this.isPlaceholderEmail(email)) {
          continue;
        }

        // Domain validation
        const domain = email.split('@')[1];
        if (this.isValidDomain(domain)) {
          validatedEmails.push({
            email,
            confidence: this.calculateEmailConfidence(email),
            domain,
            type: this.classifyEmailType(email)
          });
        }

      } catch (error) {
        logger.debug(`Email validation error for ${email}`, {
          platform: 'email_validation',
          email,
          error: error.message
        });
      }
    }

    // Sort by confidence and return top results
    return validatedEmails
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5) // Limit to top 5 emails per website
      .map(item => item.email);
  }

  formatPhones(phones) {
    return phones
      .map(phone => {
        // Remove all non-digit characters except +
        let cleaned = phone.replace(/[^\d+]/g, '');

        // Format US numbers
        if (cleaned.length === 10) {
          return `+1${cleaned}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
          return `+${cleaned}`;
        } else if (cleaned.startsWith('+')) {
          return cleaned;
        }

        return phone; // Return original if can't format
      })
      .filter(phone => phone.length >= 10)
      .slice(0, 3); // Limit to 3 phones per website
  }

  isBlacklistedEmail(email) {
    const blacklist = [
      'noreply@',
      'no-reply@',
      'donotreply@',
      'admin@',
      'webmaster@',
      'postmaster@',
      'mailer-daemon@',
      'example@',
      'test@',
      'sample@',
      'demo@'
    ];

    return blacklist.some(blocked => email.startsWith(blocked));
  }

  isPlaceholderEmail(email) {
    const placeholders = [
      'example.com',
      'test.com',
      'sample.com',
      'demo.com',
      'yourdomain.com',
      'yoursite.com',
      'placeholder.com'
    ];

    const domain = email.split('@')[1];
    return placeholders.some(placeholder => domain === placeholder);
  }

  isValidDomain(domain) {
    // Check if domain has valid TLD
    const validTlds = [
      '.com', '.org', '.net', '.edu', '.gov', '.co', '.io',
      '.me', '.us', '.ca', '.uk', '.au', '.de', '.fr'
    ];

    return validTlds.some(tld => domain.endsWith(tld));
  }

  calculateEmailConfidence(email) {
    let confidence = 0.5; // Base confidence

    const domain = email.split('@')[1];
    const localPart = email.split('@')[0];

    // Professional domains get higher confidence
    const professionalDomains = ['.com', '.org', '.net'];
    if (professionalDomains.some(tld => domain.endsWith(tld))) {
      confidence += 0.2;
    }

    // Personal domains (gmail, yahoo, etc.) are still acceptable for healers
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (personalDomains.includes(domain)) {
      confidence += 0.1;
    }

    // Professional-looking local part
    if (localPart.includes('.') || localPart.includes('_')) {
      confidence += 0.1;
    }

    // Avoid obviously generated emails
    if (/\d{4,}/.test(localPart)) {
      confidence -= 0.2;
    }

    return Math.max(0.1, Math.min(confidence, 1.0));
  }

  classifyEmailType(email) {
    const domain = email.split('@')[1];
    const localPart = email.split('@')[0].toLowerCase();

    // Business/contact emails
    if (['info', 'contact', 'hello', 'inquiries', 'booking'].some(prefix => localPart.startsWith(prefix))) {
      return 'business';
    }

    // Personal emails
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (personalDomains.includes(domain)) {
      return 'personal';
    }

    return 'professional';
  }

  async enrichHealerContacts(healer) {
    try {
      logger.info(`Enriching contact information for healer: ${healer.name}`, {
        platform: 'contact_enrichment',
        healer: healer.name
      });

      const enrichedData = { ...healer };

      // Extract from website if available
      if (healer.website) {
        const websiteContacts = await this.extractContactsFromWebsite(healer.website);

        if (websiteContacts.emails.length > 0) {
          enrichedData.email = websiteContacts.emails[0]; // Primary email
          enrichedData.additional_emails = websiteContacts.emails.slice(1);
          enrichedData.contact_confidence = Math.max(
            enrichedData.contact_confidence || 0.5,
            0.8
          );
        }

        if (websiteContacts.phones.length > 0) {
          enrichedData.phone = websiteContacts.phones[0]; // Primary phone
          enrichedData.additional_phones = websiteContacts.phones.slice(1);
        }
      }

      // Try to extract email from Instagram bio if available
      if (healer.bio && !enrichedData.email) {
        const bioEmails = this.extractEmails(healer.bio);
        if (bioEmails.length > 0) {
          const validatedBioEmails = await this.validateEmails(bioEmails);
          if (validatedBioEmails.length > 0) {
            enrichedData.email = validatedBioEmails[0];
            enrichedData.contact_confidence = Math.max(
              enrichedData.contact_confidence || 0.5,
              0.7
            );
          }
        }
      }

      // Extract phone from bio
      if (healer.bio && !enrichedData.phone) {
        const bioPhones = this.extractPhones(healer.bio);
        if (bioPhones.length > 0) {
          const formattedBioPhones = this.formatPhones(bioPhones);
          if (formattedBioPhones.length > 0) {
            enrichedData.phone = formattedBioPhones[0];
          }
        }
      }

      // Add notes about contact sources
      const contactSources = [];
      if (enrichedData.email) contactSources.push('email extracted');
      if (enrichedData.phone) contactSources.push('phone extracted');
      if (enrichedData.website) contactSources.push('website available');

      if (contactSources.length > 0) {
        enrichedData.notes = (enrichedData.notes || '') + ` Contact info: ${contactSources.join(', ')}.`;
      }

      logger.info(`Contact enrichment complete for ${healer.name}`, {
        platform: 'contact_enrichment',
        healer: healer.name,
        hasEmail: !!enrichedData.email,
        hasPhone: !!enrichedData.phone,
        confidence: enrichedData.contact_confidence
      });

      return enrichedData;

    } catch (error) {
      logger.error(`Error enriching contacts for ${healer.name}`, error, {
        platform: 'contact_enrichment',
        healer: healer.name
      });
      return healer; // Return original if enrichment fails
    }
  }

  async batchEnrichHealers(healers) {
    const enrichedHealers = [];

    for (let i = 0; i < healers.length; i++) {
      const healer = healers[i];

      try {
        // Check rate limits
        const rateLimitCheck = await this.rateLimiter.canPerformAction('enrichment', 'contact_extraction');
        if (!rateLimitCheck.allowed) {
          logger.rateLimitHit('enrichment', 'contact_extraction', rateLimitCheck.resetTime);

          // Add remaining healers without enrichment
          enrichedHealers.push(...healers.slice(i));
          break;
        }

        const enrichedHealer = await this.enrichHealerContacts(healer);
        enrichedHealers.push(enrichedHealer);

        // Record the action
        await this.rateLimiter.recordAction('enrichment', 'contact_extraction');

        // Delay between enrichments
        const delay = await this.rateLimiter.getRandomDelay();
        await this.sleep(delay);

      } catch (error) {
        logger.error(`Error in batch enrichment for healer ${healer.name}`, error);
        enrichedHealers.push(healer); // Add original if enrichment fails
      }
    }

    logger.info(`Batch contact enrichment complete: ${enrichedHealers.length} healers processed`, {
      platform: 'contact_enrichment',
      totalProcessed: enrichedHealers.length,
      withContacts: enrichedHealers.filter(h => h.email || h.phone).length
    });

    return enrichedHealers;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ContactExtractor;