const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');

class ConservativeRateLimiter {
  constructor(database, config = {}) {
    this.db = database;
    this.config = {
      // Conservative daily limits
      instagram: {
        profiles: 12,
        likes: 20,
        follows: 10,
        actions_per_hour: 8
      },
      email: {
        daily: 25,
        hourly: 5,
        batch_size: 5
      },
      directories: {
        psychology_today: 8,
        wellness_directories: 10,
        google_my_business: 7,
        linkedin: 15
      },
      // Safety delays (in seconds)
      delays: {
        min: 60,
        max: 180,
        between_platforms: 300, // 5 minutes
        email_batch_gap: 3600 * 3 // 3 hours
      },
      // Progressive ramping
      progressive: {
        starting_limit: 5,
        weekly_increase: 3,
        max_limit: 25
      },
      ...config
    };

    this.initializeLimiters();
  }

  initializeLimiters() {
    // Instagram rate limiters
    this.instagramLimiter = new RateLimiterMemory({
      keyGenerator: () => 'instagram_actions',
      points: this.config.instagram.actions_per_hour,
      duration: 3600, // 1 hour
    });

    this.instagramDailyLimiter = new RateLimiterMemory({
      keyGenerator: () => 'instagram_daily',
      points: this.config.instagram.profiles,
      duration: 86400, // 24 hours
    });

    // Email rate limiters
    this.emailHourlyLimiter = new RateLimiterMemory({
      keyGenerator: () => 'email_hourly',
      points: this.config.email.hourly,
      duration: 3600,
    });

    this.emailDailyLimiter = new RateLimiterMemory({
      keyGenerator: () => 'email_daily',
      points: this.config.email.daily,
      duration: 86400,
    });

    // Directory limiters
    this.directoryLimiters = {};
    Object.entries(this.config.directories).forEach(([platform, limit]) => {
      this.directoryLimiters[platform] = new RateLimiterMemory({
        keyGenerator: () => `${platform}_daily`,
        points: limit,
        duration: 86400,
      });
    });
  }

  async canPerformAction(platform, actionType) {
    try {
      // Check if weekend mode is enabled
      if (await this.isWeekendModeActive()) {
        return { allowed: false, reason: 'Weekend mode is active' };
      }

      // Check progressive ramping limits
      const currentLimit = await this.getProgressiveLimit();

      switch (platform) {
        case 'instagram':
          return await this.checkInstagramLimits(actionType, currentLimit);
        case 'email':
          return await this.checkEmailLimits(currentLimit);
        default:
          if (this.directoryLimiters[platform]) {
            return await this.checkDirectoryLimits(platform, currentLimit);
          }
          return { allowed: false, reason: 'Unknown platform' };
      }
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: false, reason: 'Rate limit check failed' };
    }
  }

  async checkInstagramLimits(actionType, dailyLimit) {
    try {
      // Check hourly limit
      await this.instagramLimiter.consume('instagram_actions');

      // Check daily limit (use progressive limit, not platform maximum)
      const adjustedLimit = Math.min(dailyLimit, this.config.instagram.profiles);
      this.instagramDailyLimiter.points = adjustedLimit;
      await this.instagramDailyLimiter.consume('instagram_daily');

      // Check database rate limits for additional safety
      const canProceed = await this.db.checkRateLimit('instagram', actionType, adjustedLimit);
      if (!canProceed) {
        return { allowed: false, reason: `Daily Instagram limit reached (${adjustedLimit})` };
      }

      return { allowed: true, reason: 'Instagram action permitted' };
    } catch (rateLimiterRes) {
      if (rateLimiterRes.remainingPoints === 0) {
        const resetTime = new Date(Date.now() + rateLimiterRes.msBeforeNext);
        return {
          allowed: false,
          reason: 'Instagram rate limit exceeded',
          resetTime
        };
      }
      throw rateLimiterRes;
    }
  }

  async checkEmailLimits(dailyLimit) {
    try {
      // Check hourly limit
      await this.emailHourlyLimiter.consume('email_hourly');

      // Check daily limit (use progressive limit)
      const adjustedLimit = Math.min(dailyLimit, this.config.email.daily);
      this.emailDailyLimiter.points = adjustedLimit;
      await this.emailDailyLimiter.consume('email_daily');

      // Check database rate limits
      const canProceed = await this.db.checkRateLimit('email', 'outreach', adjustedLimit);
      if (!canProceed) {
        return { allowed: false, reason: `Daily email limit reached (${adjustedLimit})` };
      }

      return { allowed: true, reason: 'Email action permitted' };
    } catch (rateLimiterRes) {
      if (rateLimiterRes.remainingPoints === 0) {
        const resetTime = new Date(Date.now() + rateLimiterRes.msBeforeNext);
        return {
          allowed: false,
          reason: 'Email rate limit exceeded',
          resetTime
        };
      }
      throw rateLimiterRes;
    }
  }

  async checkDirectoryLimits(platform, dailyLimit) {
    try {
      const limiter = this.directoryLimiters[platform];
      if (!limiter) {
        return { allowed: false, reason: 'Platform limiter not found' };
      }

      // Use conservative platform limit or progressive limit, whichever is smaller
      const platformMax = this.config.directories[platform];
      const adjustedLimit = Math.min(dailyLimit, platformMax);
      limiter.points = adjustedLimit;

      await limiter.consume(`${platform}_daily`);

      // Check database rate limits
      const canProceed = await this.db.checkRateLimit(platform, 'discovery', adjustedLimit);
      if (!canProceed) {
        return { allowed: false, reason: `Daily ${platform} limit reached (${adjustedLimit})` };
      }

      return { allowed: true, reason: `${platform} action permitted` };
    } catch (rateLimiterRes) {
      if (rateLimiterRes.remainingPoints === 0) {
        const resetTime = new Date(Date.now() + rateLimiterRes.msBeforeNext);
        return {
          allowed: false,
          reason: `${platform} rate limit exceeded`,
          resetTime
        };
      }
      throw rateLimiterRes;
    }
  }

  async recordAction(platform, actionType) {
    try {
      await this.db.incrementRateLimit(platform, actionType);
      console.log(`Recorded ${actionType} action for ${platform}`);
    } catch (error) {
      console.error('Error recording action:', error);
    }
  }

  async getProgressiveLimit() {
    try {
      const currentWeek = await this.db.getSetting('current_week') || '1';
      const week = parseInt(currentWeek);

      const { starting_limit, weekly_increase, max_limit } = this.config.progressive;
      const progressiveLimit = Math.min(
        starting_limit + ((week - 1) * weekly_increase),
        max_limit
      );

      return progressiveLimit;
    } catch (error) {
      console.error('Error calculating progressive limit:', error);
      return this.config.progressive.starting_limit;
    }
  }

  async isWeekendModeActive() {
    try {
      const weekendMode = await this.db.getSetting('weekend_mode');
      if (weekendMode !== 'true') {
        return false;
      }

      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = now.getHours();

      // Weekend mode: Friday 6 PM - Monday 9 AM
      if (day === 6 || day === 0) { // Saturday or Sunday
        return true;
      }
      if (day === 5 && hour >= 18) { // Friday after 6 PM
        return true;
      }
      if (day === 1 && hour < 9) { // Monday before 9 AM
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking weekend mode:', error);
      return false;
    }
  }

  async getRandomDelay() {
    const { min, max } = this.config.delays;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return delay * 1000; // Convert to milliseconds
  }

  async getBetweenPlatformDelay() {
    const baseDelay = this.config.delays.between_platforms * 1000;
    const variation = Math.random() * 60 * 1000; // Up to 1 minute variation
    return baseDelay + variation;
  }

  async getEmailBatchDelay() {
    return this.config.delays.email_batch_gap * 1000;
  }

  // Update progressive settings
  async updateWeek(week) {
    await this.db.setSetting('current_week', week.toString());
    console.log(`Updated to week ${week}, progressive limit: ${await this.getProgressiveLimit()}`);
  }

  async enableManualApproval() {
    await this.db.setSetting('manual_approval_required', 'true');
  }

  async disableManualApproval() {
    await this.db.setSetting('manual_approval_required', 'false');
  }

  async isManualApprovalRequired() {
    const setting = await this.db.getSetting('manual_approval_required');
    return setting === 'true';
  }

  // Get current status
  async getStatus() {
    const currentWeek = await this.db.getSetting('current_week') || '1';
    const progressiveLimit = await this.getProgressiveLimit();
    const weekendMode = await this.isWeekendModeActive();
    const manualApproval = await this.isManualApprovalRequired();

    return {
      currentWeek: parseInt(currentWeek),
      progressiveLimit,
      weekendMode,
      manualApproval,
      config: this.config
    };
  }

  // Emergency stop
  async emergencyStop(reason) {
    console.log(`EMERGENCY STOP ACTIVATED: ${reason}`);
    await this.db.setSetting('emergency_stop', 'true');
    await this.db.setSetting('emergency_reason', reason);
    await this.db.setSetting('emergency_time', new Date().toISOString());
  }

  async isEmergencyStopped() {
    const stopped = await this.db.getSetting('emergency_stop');
    return stopped === 'true';
  }

  async clearEmergencyStop() {
    await this.db.setSetting('emergency_stop', 'false');
    console.log('Emergency stop cleared');
  }
}

module.exports = ConservativeRateLimiter;