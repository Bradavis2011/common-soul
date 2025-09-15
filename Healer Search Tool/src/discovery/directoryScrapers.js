const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const logger = require('../utils/logger');

class DirectoryScrapers {
  constructor(database, rateLimiter, config = {}) {
    this.db = database;
    this.rateLimiter = rateLimiter;
    this.config = {
      headless: true,
      timeout: 30000,
      // Conservative search limits
      maxResults: {
        psychology_today: 8,
        google_my_business: 7,
        wellness_directories: 10
      },
      // Geographic targets (major spiritual communities)
      locations: [
        'Los Angeles, CA',
        'New York, NY',
        'Boulder, CO',
        'Sedona, AZ',
        'Portland, OR',
        'Austin, TX',
        'Asheville, NC',
        'San Francisco, CA',
        'Santa Fe, NM',
        'Miami, FL'
      ],
      // Spiritual therapy search terms
      searchTerms: {
        psychology_today: [
          'energy healing',
          'holistic therapy',
          'spiritual counseling',
          'mindfulness therapy',
          'alternative healing'
        ],
        google_my_business: [
          'reiki healing',
          'crystal healing',
          'spiritual healer',
          'energy healing',
          'holistic wellness'
        ]
      },
      ...config
    };
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      logger.info('Initializing directory scrapers browser', {
        platform: 'directory_scrapers'
      });

      const userAgent = new UserAgent();

      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        slowMo: 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(userAgent.toString());
      await this.page.setViewport({ width: 1366, height: 768 });

      // Block unnecessary resources
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      logger.info('Directory scrapers browser initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize directory scrapers browser', error);
      throw error;
    }
  }

  async searchPsychologyToday(searchTerm, location) {
    try {
      logger.discoveryStart('psychology_today', `${searchTerm} in ${location}`);

      // Check rate limits
      const rateLimitCheck = await this.rateLimiter.canPerformAction('psychology_today', 'discovery');
      if (!rateLimitCheck.allowed) {
        logger.rateLimitHit('psychology_today', 'discovery', rateLimitCheck.resetTime);
        return [];
      }

      // Build Psychology Today search URL
      const encodedTerm = encodeURIComponent(searchTerm);
      const encodedLocation = encodeURIComponent(location);
      const url = `https://www.psychologytoday.com/us/therapists/${encodedTerm}/${encodedLocation}`;

      logger.info(`Searching Psychology Today: ${url}`, {
        platform: 'psychology_today',
        searchTerm,
        location
      });

      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout
      });

      // Wait for results to load
      try {
        await this.page.waitForSelector('[data-testid="therapist-card"]', { timeout: 10000 });
      } catch (error) {
        logger.info('No therapist cards found on Psychology Today', {
          platform: 'psychology_today',
          searchTerm,
          location
        });
        return [];
      }

      // Random delay
      const delay = await this.rateLimiter.getRandomDelay();
      await this.sleep(delay);

      // Extract therapist data
      const healers = await this.page.evaluate((maxResults) => {
        const results = [];
        const therapistCards = document.querySelectorAll('[data-testid="therapist-card"]');

        for (let i = 0; i < Math.min(therapistCards.length, maxResults); i++) {
          const card = therapistCards[i];

          try {
            const nameElement = card.querySelector('h2 a, .therapist-name a, [data-testid="therapist-name"]');
            const name = nameElement ? nameElement.textContent.trim() : '';

            const locationElement = card.querySelector('.therapist-location, [data-testid="therapist-location"]');
            const location = locationElement ? locationElement.textContent.trim() : '';

            const specialtiesElement = card.querySelector('.therapist-specialties, .specialties');
            const specialties = specialtiesElement ? specialtiesElement.textContent.trim() : '';

            const bioElement = card.querySelector('.therapist-bio, .bio-preview');
            const bio = bioElement ? bioElement.textContent.trim() : '';

            const profileLinkElement = card.querySelector('h2 a, .therapist-name a');
            const profileLink = profileLinkElement ? profileLinkElement.getAttribute('href') : '';

            if (name && (bio.toLowerCase().includes('spiritual') ||
                       bio.toLowerCase().includes('holistic') ||
                       bio.toLowerCase().includes('energy') ||
                       bio.toLowerCase().includes('mindfulness') ||
                       specialties.toLowerCase().includes('spiritual'))) {
              results.push({
                name,
                location,
                bio,
                specialties,
                profileLink: profileLink.startsWith('http') ? profileLink : `https://www.psychologytoday.com${profileLink}`
              });
            }
          } catch (error) {
            console.error('Error parsing therapist card:', error);
          }
        }

        return results;
      }, this.config.maxResults.psychology_today);

      // Enrich each healer profile
      const enrichedHealers = [];
      for (const healer of healers.slice(0, 3)) { // Conservative limit
        try {
          const enrichedHealer = await this.enrichPsychologyTodayProfile(healer);
          enrichedHealers.push(enrichedHealer);

          // Delay between profile enrichments
          const profileDelay = await this.rateLimiter.getRandomDelay();
          await this.sleep(profileDelay);

        } catch (error) {
          logger.error(`Error enriching Psychology Today profile for ${healer.name}`, error);
          enrichedHealers.push(this.createBasicHealerProfile(healer, 'psychology_today'));
        }
      }

      await this.rateLimiter.recordAction('psychology_today', 'discovery');

      logger.discoveryComplete('psychology_today', enrichedHealers.length, 0);
      return enrichedHealers;

    } catch (error) {
      logger.error(`Error searching Psychology Today for ${searchTerm} in ${location}`, error);
      return [];
    }
  }

  async enrichPsychologyTodayProfile(healer) {
    try {
      if (!healer.profileLink) {
        return this.createBasicHealerProfile(healer, 'psychology_today');
      }

      // Visit the full profile page
      await this.page.goto(healer.profileLink, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout
      });

      // Extract additional details
      const profileData = await this.page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };

        const fullBio = getTextContent('.therapist-bio, .bio-content, [data-testid="bio-content"]');
        const phone = getTextContent('.therapist-phone, [data-testid="phone"]');
        const website = getTextContent('.therapist-website a, [data-testid="website"] a');
        const yearsExperience = getTextContent('.years-experience, [data-testid="years-experience"]');
        const credentials = getTextContent('.credentials, [data-testid="credentials"]');

        return {
          fullBio: fullBio || '',
          phone: phone || '',
          website: website || '',
          yearsExperience: yearsExperience || '',
          credentials: credentials || ''
        };
      });

      return {
        name: healer.name,
        bio: profileData.fullBio || healer.bio,
        location: healer.location,
        phone: this.cleanPhoneNumber(profileData.phone),
        website: profileData.website,
        specialties: this.extractSpecialtiesFromText(healer.specialties + ' ' + profileData.fullBio),
        years_experience: this.extractYearsFromText(profileData.yearsExperience),
        certifications: profileData.credentials ? [profileData.credentials] : [],
        source_platform: 'psychology_today',
        contact_confidence: this.calculateDirectoryConfidence(profileData),
        profile_url: healer.profileLink,
        notes: `Found on Psychology Today. ${profileData.credentials || 'Licensed therapist'}.`
      };

    } catch (error) {
      logger.error(`Error enriching Psychology Today profile for ${healer.name}`, error);
      return this.createBasicHealerProfile(healer, 'psychology_today');
    }
  }

  async searchGoogleMyBusiness(searchTerm, location) {
    try {
      logger.discoveryStart('google_my_business', `${searchTerm} in ${location}`);

      // Check rate limits
      const rateLimitCheck = await this.rateLimiter.canPerformAction('google_my_business', 'discovery');
      if (!rateLimitCheck.allowed) {
        logger.rateLimitHit('google_my_business', 'discovery', rateLimitCheck.resetTime);
        return [];
      }

      // Build Google Maps search URL
      const query = `${searchTerm} ${location}`;
      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.google.com/maps/search/${encodedQuery}`;

      logger.info(`Searching Google My Business: ${query}`, {
        platform: 'google_my_business',
        searchTerm,
        location
      });

      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout
      });

      // Wait for map results
      try {
        await this.page.waitForSelector('[data-result-index]', { timeout: 15000 });
      } catch (error) {
        logger.info('No Google My Business results found', {
          platform: 'google_my_business',
          query
        });
        return [];
      }

      // Random delay
      const delay = await this.rateLimiter.getRandomDelay();
      await this.sleep(delay);

      // Extract business data
      const healers = await this.page.evaluate((maxResults) => {
        const results = [];
        const businessCards = document.querySelectorAll('[data-result-index]');

        for (let i = 0; i < Math.min(businessCards.length, maxResults); i++) {
          const card = businessCards[i];

          try {
            const nameElement = card.querySelector('[data-value="Business name"]');
            const name = nameElement ? nameElement.textContent.trim() : '';

            const ratingElement = card.querySelector('[data-value="Rating"]');
            const rating = ratingElement ? ratingElement.textContent.trim() : '';

            const addressElement = card.querySelector('[data-value="Address"]');
            const address = addressElement ? addressElement.textContent.trim() : '';

            const phoneElement = card.querySelector('[data-value="Phone"]');
            const phone = phoneElement ? phoneElement.textContent.trim() : '';

            const websiteElement = card.querySelector('[data-value="Website"]');
            const website = websiteElement ? websiteElement.getAttribute('href') : '';

            if (name && (name.toLowerCase().includes('healing') ||
                        name.toLowerCase().includes('wellness') ||
                        name.toLowerCase().includes('spiritual') ||
                        name.toLowerCase().includes('reiki'))) {
              results.push({
                name,
                rating,
                address,
                phone,
                website
              });
            }
          } catch (error) {
            console.error('Error parsing business card:', error);
          }
        }

        return results;
      }, this.config.maxResults.google_my_business);

      // Convert to healer profiles
      const healerProfiles = healers.map(business => ({
        name: business.name,
        location: business.address,
        phone: this.cleanPhoneNumber(business.phone),
        website: business.website,
        specialties: this.inferSpecialtiesFromName(business.name),
        source_platform: 'google_my_business',
        contact_confidence: business.phone && business.website ? 0.8 : 0.6,
        notes: `Found on Google My Business. ${business.rating ? `Rating: ${business.rating}` : 'Local business'}`,
        bio: `${business.name} - Local healing practice in ${business.address || location}`
      }));

      await this.rateLimiter.recordAction('google_my_business', 'discovery');

      logger.discoveryComplete('google_my_business', healerProfiles.length, 0);
      return healerProfiles;

    } catch (error) {
      logger.error(`Error searching Google My Business for ${searchTerm} in ${location}`, error);
      return [];
    }
  }

  async discoverFromDirectories() {
    try {
      if (!this.browser) {
        await this.init();
      }

      const allHealers = [];
      const shuffledLocations = this.shuffleArray([...this.config.locations]);

      // Psychology Today searches
      const ptTerms = this.config.searchTerms.psychology_today;
      for (const location of shuffledLocations.slice(0, 3)) { // Limit to 3 cities
        for (const term of ptTerms.slice(0, 2)) { // Limit to 2 terms per city
          try {
            const canProceed = await this.rateLimiter.canPerformAction('psychology_today', 'discovery');
            if (!canProceed.allowed) {
              logger.rateLimitHit('psychology_today', 'discovery', canProceed.resetTime);
              break;
            }

            const healers = await this.searchPsychologyToday(term, location);
            allHealers.push(...healers);

            // Save to database
            for (const healer of healers) {
              try {
                await this.db.addHealer(healer);
                logger.healerDiscovered(healer, 'psychology_today');
              } catch (dbError) {
                if (!dbError.message.includes('UNIQUE constraint')) {
                  logger.error('Database error saving Psychology Today healer', dbError);
                }
              }
            }

            // Delay between searches
            const searchDelay = await this.rateLimiter.getBetweenPlatformDelay() / 2;
            await this.sleep(searchDelay);

          } catch (error) {
            logger.error(`Error with Psychology Today search: ${term} in ${location}`, error);
            continue;
          }
        }
      }

      // Google My Business searches
      const gmbTerms = this.config.searchTerms.google_my_business;
      for (const location of shuffledLocations.slice(0, 2)) { // Limit to 2 cities
        for (const term of gmbTerms.slice(0, 2)) { // Limit to 2 terms per city
          try {
            const canProceed = await this.rateLimiter.canPerformAction('google_my_business', 'discovery');
            if (!canProceed.allowed) {
              logger.rateLimitHit('google_my_business', 'discovery', canProceed.resetTime);
              break;
            }

            const healers = await this.searchGoogleMyBusiness(term, location);
            allHealers.push(...healers);

            // Save to database
            for (const healer of healers) {
              try {
                await this.db.addHealer(healer);
                logger.healerDiscovered(healer, 'google_my_business');
              } catch (dbError) {
                if (!dbError.message.includes('UNIQUE constraint')) {
                  logger.error('Database error saving Google My Business healer', dbError);
                }
              }
            }

            // Delay between searches
            const searchDelay = await this.rateLimiter.getBetweenPlatformDelay() / 2;
            await this.sleep(searchDelay);

          } catch (error) {
            logger.error(`Error with Google My Business search: ${term} in ${location}`, error);
            continue;
          }
        }
      }

      logger.info(`Directory discovery complete: found ${allHealers.length} total healers`, {
        platform: 'directory_scrapers',
        totalFound: allHealers.length,
        sources: {
          psychology_today: allHealers.filter(h => h.source_platform === 'psychology_today').length,
          google_my_business: allHealers.filter(h => h.source_platform === 'google_my_business').length
        }
      });

      return allHealers;

    } catch (error) {
      logger.error('Directory discovery failed', error);
      throw error;
    }
  }

  // Helper methods
  createBasicHealerProfile(healer, platform) {
    return {
      name: healer.name,
      bio: healer.bio || '',
      location: healer.location || '',
      specialties: this.extractSpecialtiesFromText(healer.bio + ' ' + healer.specialties),
      source_platform: platform,
      contact_confidence: 0.5,
      notes: `Found on ${platform}. Basic profile information available.`
    };
  }

  extractSpecialtiesFromText(text) {
    if (!text) return [];

    const specialtyKeywords = {
      'Reiki': ['reiki'],
      'Energy Healing': ['energy healing', 'energy work'],
      'Spiritual Coaching': ['spiritual', 'spiritual guidance', 'spiritual coaching'],
      'Holistic Therapy': ['holistic', 'holistic therapy', 'holistic healing'],
      'Mindfulness': ['mindfulness', 'mindful', 'meditation'],
      'Crystal Healing': ['crystal', 'crystals'],
      'Alternative Healing': ['alternative', 'complementary'],
      'Wellness Coaching': ['wellness', 'wellbeing']
    };

    const foundSpecialties = [];
    const textLower = text.toLowerCase();

    Object.entries(specialtyKeywords).forEach(([specialty, keywords]) => {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        foundSpecialties.push(specialty);
      }
    });

    return foundSpecialties;
  }

  inferSpecialtiesFromName(businessName) {
    const nameLower = businessName.toLowerCase();
    const specialties = [];

    if (nameLower.includes('reiki')) specialties.push('Reiki');
    if (nameLower.includes('crystal')) specialties.push('Crystal Healing');
    if (nameLower.includes('wellness')) specialties.push('Wellness Coaching');
    if (nameLower.includes('healing')) specialties.push('Energy Healing');
    if (nameLower.includes('spiritual')) specialties.push('Spiritual Coaching');
    if (nameLower.includes('holistic')) specialties.push('Holistic Therapy');

    return specialties.length > 0 ? specialties : ['Alternative Healing'];
  }

  extractYearsFromText(text) {
    if (!text) return null;

    const yearMatch = text.match(/(\d+)\s*years?/i);
    return yearMatch ? parseInt(yearMatch[1]) : null;
  }

  cleanPhoneNumber(phone) {
    if (!phone) return null;

    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.length >= 10) {
      return cleaned.startsWith('+') ? cleaned : `+1${cleaned}`;
    }

    return null;
  }

  calculateDirectoryConfidence(profileData) {
    let confidence = 0.6; // Base confidence for directory listings

    if (profileData.phone) confidence += 0.2;
    if (profileData.website) confidence += 0.2;
    if (profileData.fullBio && profileData.fullBio.length > 100) confidence += 0.1;
    if (profileData.credentials) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      logger.info('Directory scrapers browser closed');
    }
  }
}

module.exports = DirectoryScrapers;