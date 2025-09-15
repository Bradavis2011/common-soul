const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const logger = require('../utils/logger');

class InstagramDiscovery {
  constructor(database, rateLimiter, config = {}) {
    this.db = database;
    this.rateLimiter = rateLimiter;
    this.config = {
      headless: true,
      slowMo: 100,
      timeout: 30000,
      viewport: { width: 1366, height: 768 },
      // Conservative Instagram settings
      hashtags: [
        '#reikihealer',
        '#crystalhealing',
        '#energyhealer',
        '#spiritualguide',
        '#chakrahealing',
        '#soundtherapy',
        '#holistic healer',
        '#meditation teacher',
        '#spiritualcoach',
        '#lightworker'
      ],
      maxProfilesPerHashtag: 3,
      minFollowers: 100,
      maxFollowers: 50000, // Avoid mega-influencers
      ...config
    };
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      logger.info('Initializing Instagram discovery browser', { platform: 'instagram' });

      const userAgent = new UserAgent();

      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();

      await this.page.setViewport(this.config.viewport);
      await this.page.setUserAgent(userAgent.toString());

      // Block unnecessary resources to speed up scraping
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      logger.info('Instagram browser initialized successfully', { platform: 'instagram' });
      return true;
    } catch (error) {
      logger.error('Failed to initialize Instagram browser', error, { platform: 'instagram' });
      throw error;
    }
  }

  async searchHashtag(hashtag) {
    try {
      logger.discoveryStart('instagram', hashtag);
      const startTime = Date.now();

      // Check rate limits before proceeding
      const rateLimitCheck = await this.rateLimiter.canPerformAction('instagram', 'hashtag_search');
      if (!rateLimitCheck.allowed) {
        logger.rateLimitHit('instagram', 'hashtag_search', rateLimitCheck.resetTime);
        return [];
      }

      const url = `https://www.instagram.com/explore/tags/${hashtag.replace('#', '')}/`;

      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });

      // Wait for content to load
      await this.page.waitForSelector('article', { timeout: 10000 });

      // Random delay to simulate human behavior
      const delay = await this.rateLimiter.getRandomDelay();
      await this.sleep(delay);

      // Extract profile links from posts
      const profileLinks = await this.page.evaluate(() => {
        const links = [];
        const postElements = document.querySelectorAll('article a[href*="/p/"]');

        for (let i = 0; i < Math.min(postElements.length, 20); i++) {
          const element = postElements[i];
          const href = element.getAttribute('href');
          if (href) {
            // Extract potential profile link from post context
            const parentElement = element.closest('article');
            const profileLinkElement = parentElement?.querySelector('a[href^="/"][href*="/"]');
            if (profileLinkElement) {
              const profileHref = profileLinkElement.getAttribute('href');
              if (profileHref && !profileHref.includes('/p/') && !profileHref.includes('/reel/')) {
                links.push(profileHref);
              }
            }
          }
        }

        return [...new Set(links)]; // Remove duplicates
      });

      logger.info(`Found ${profileLinks.length} profile links for hashtag ${hashtag}`, {
        platform: 'instagram',
        hashtag,
        profileCount: profileLinks.length
      });

      // Process profiles with strict limits
      const healers = [];
      const maxProfiles = Math.min(profileLinks.length, this.config.maxProfilesPerHashtag);

      for (let i = 0; i < maxProfiles; i++) {
        try {
          // Check rate limits for each profile
          const profileRateCheck = await this.rateLimiter.canPerformAction('instagram', 'profile_extraction');
          if (!profileRateCheck.allowed) {
            logger.rateLimitHit('instagram', 'profile_extraction', profileRateCheck.resetTime);
            break;
          }

          const healer = await this.extractProfileData(profileLinks[i]);
          if (healer && this.isQualifiedHealer(healer)) {
            healers.push(healer);
            logger.healerDiscovered(healer, 'instagram');

            // Record the action for rate limiting
            await this.rateLimiter.recordAction('instagram', 'profile_extraction');
          }

          // Delay between profiles
          const profileDelay = await this.rateLimiter.getRandomDelay();
          await this.sleep(profileDelay);

        } catch (error) {
          logger.error(`Error processing profile ${profileLinks[i]}`, error, {
            platform: 'instagram',
            profileUrl: profileLinks[i]
          });
          continue;
        }
      }

      // Record hashtag search action
      await this.rateLimiter.recordAction('instagram', 'hashtag_search');

      const duration = Date.now() - startTime;
      logger.discoveryComplete('instagram', healers.length, duration);

      return healers;

    } catch (error) {
      logger.error(`Error searching hashtag ${hashtag}`, error, { platform: 'instagram' });
      throw error;
    }
  }

  async extractProfileData(profileUrl) {
    try {
      if (!profileUrl.startsWith('/')) {
        profileUrl = '/' + profileUrl.replace(/^https?:\/\/[^\/]+/, '');
      }

      const fullUrl = `https://www.instagram.com${profileUrl}`;

      await this.page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: this.config.timeout });

      // Wait for profile data to load
      await this.page.waitForSelector('header', { timeout: 10000 });

      const profileData = await this.page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };

        const getNumber = (text) => {
          if (!text) return 0;
          const match = text.match(/[\d,]+/);
          return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
        };

        // Extract basic profile information
        const name = getTextContent('header h2') || getTextContent('header h1');
        const bio = getTextContent('header div[data-testid="user-name"] + div') ||
                   getTextContent('header section div span') || '';

        // Get follower count
        const followersText = getTextContent('header a[href*="/followers/"] span') ||
                             getTextContent('header section ul li span[title]') || '';
        const followersCount = getNumber(followersText);

        // Get posts count
        const postsText = getTextContent('header section ul li span') || '';
        const postsCount = getNumber(postsText);

        // Extract potential website from bio
        const websiteLink = document.querySelector('header a[href^="http"]');
        const website = websiteLink ? websiteLink.getAttribute('href') : null;

        // Get profile image
        const profileImg = document.querySelector('header img');
        const profileImageUrl = profileImg ? profileImg.getAttribute('src') : null;

        return {
          name,
          bio,
          followersCount,
          postsCount,
          website,
          profileImageUrl,
          profileUrl: window.location.pathname
        };
      });

      if (!profileData.name) {
        logger.debug('No profile data extracted, skipping profile', {
          platform: 'instagram',
          profileUrl
        });
        return null;
      }

      // Enhance profile data
      const healer = {
        name: profileData.name,
        bio: profileData.bio,
        website: profileData.website,
        instagram: `https://instagram.com${profileData.profileUrl}`,
        location: this.extractLocationFromBio(profileData.bio),
        specialties: this.extractSpecialtiesFromBio(profileData.bio),
        follower_count: profileData.followersCount,
        profile_image_url: profileData.profileImageUrl,
        source_platform: 'instagram',
        contact_confidence: this.calculateContactConfidence(profileData),
        notes: `Discovered via Instagram. ${profileData.postsCount} posts, ${profileData.followersCount} followers.`
      };

      return healer;

    } catch (error) {
      logger.error(`Error extracting profile data from ${profileUrl}`, error, {
        platform: 'instagram',
        profileUrl
      });
      return null;
    }
  }

  isQualifiedHealer(healer) {
    // Basic qualification checks
    if (!healer.name || healer.name.length < 2) {
      return false;
    }

    // Follower count within acceptable range
    if (healer.follower_count < this.config.minFollowers ||
        healer.follower_count > this.config.maxFollowers) {
      return false;
    }

    // Must have some spiritual/healing content indicators
    const spiritualKeywords = [
      'reiki', 'crystal', 'energy', 'healing', 'spiritual', 'chakra',
      'meditation', 'mindfulness', 'holistic', 'wellness', 'light',
      'soul', 'aura', 'manifestation', 'coach', 'guide', 'teacher'
    ];

    const bioLower = (healer.bio || '').toLowerCase();
    const hasSpirituaContent = spiritualKeywords.some(keyword =>
      bioLower.includes(keyword)
    );

    return hasSpirituaContent;
  }

  extractLocationFromBio(bio) {
    if (!bio) return null;

    // Simple location extraction patterns
    const locationPatterns = [
      /📍\s*([^•\n\r]+)/,
      /Located in\s*([^•\n\r]+)/i,
      /Based in\s*([^•\n\r]+)/i,
      /([A-Za-z\s]+,\s*[A-Za-z]{2})/,
      /([A-Za-z\s]+,\s*[A-Za-z\s]+)/
    ];

    for (const pattern of locationPatterns) {
      const match = bio.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  extractSpecialtiesFromBio(bio) {
    if (!bio) return [];

    const specialtyKeywords = {
      'Reiki': ['reiki', 'reiki master', 'reiki practitioner'],
      'Crystal Healing': ['crystal', 'crystals', 'crystal healing', 'gemstone'],
      'Energy Healing': ['energy healing', 'energy work', 'energy medicine'],
      'Spiritual Coaching': ['spiritual coach', 'life coach', 'spiritual guide'],
      'Meditation': ['meditation', 'mindfulness', 'meditation teacher'],
      'Chakra Healing': ['chakra', 'chakras', 'chakra balancing'],
      'Sound Therapy': ['sound', 'sound healing', 'singing bowls', 'sound bath'],
      'Tarot': ['tarot', 'tarot reader', 'card reading'],
      'Astrology': ['astrology', 'astrologer', 'birth chart']
    };

    const foundSpecialties = [];
    const bioLower = bio.toLowerCase();

    Object.entries(specialtyKeywords).forEach(([specialty, keywords]) => {
      if (keywords.some(keyword => bioLower.includes(keyword))) {
        foundSpecialties.push(specialty);
      }
    });

    return foundSpecialties;
  }

  calculateContactConfidence(profileData) {
    let confidence = 0.3; // Base confidence

    // Has website link
    if (profileData.website) confidence += 0.3;

    // Good follower range
    if (profileData.followersCount >= 500 && profileData.followersCount <= 10000) {
      confidence += 0.2;
    }

    // Active profile (has posts)
    if (profileData.postsCount > 10) confidence += 0.1;

    // Professional bio
    if (profileData.bio && profileData.bio.length > 50) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  async discover() {
    try {
      if (!this.browser) {
        await this.init();
      }

      const allHealers = [];
      const shuffledHashtags = this.shuffleArray([...this.config.hashtags]);

      for (const hashtag of shuffledHashtags) {
        try {
          // Check if we can continue discovering
          const canProceed = await this.rateLimiter.canPerformAction('instagram', 'discovery');
          if (!canProceed.allowed) {
            logger.rateLimitHit('instagram', 'discovery', canProceed.resetTime);
            break;
          }

          const healers = await this.searchHashtag(hashtag);

          for (const healer of healers) {
            try {
              const healerId = await this.db.addHealer(healer);
              logger.info(`Healer ${healer.name} saved with ID ${healerId}`, {
                platform: 'instagram',
                healerId,
                healer: healer.name
              });
            } catch (dbError) {
              if (dbError.message.includes('UNIQUE constraint failed')) {
                logger.debug(`Healer ${healer.name} already exists in database`, {
                  platform: 'instagram'
                });
              } else {
                logger.error('Database error saving healer', dbError, {
                  platform: 'instagram',
                  healer: healer.name
                });
              }
            }
          }

          allHealers.push(...healers);

          // Delay between hashtags
          const hashtagDelay = await this.rateLimiter.getBetweenPlatformDelay() / 3;
          await this.sleep(hashtagDelay);

        } catch (error) {
          logger.error(`Error processing hashtag ${hashtag}`, error, {
            platform: 'instagram',
            hashtag
          });
          continue;
        }
      }

      logger.info(`Instagram discovery complete: found ${allHealers.length} total healers`, {
        platform: 'instagram',
        totalFound: allHealers.length
      });

      return allHealers;

    } catch (error) {
      logger.error('Instagram discovery failed', error, { platform: 'instagram' });
      throw error;
    }
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
      logger.info('Instagram browser closed', { platform: 'instagram' });
    }
  }
}

module.exports = InstagramDiscovery;