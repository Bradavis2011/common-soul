const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for log messages
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, platform, action, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;

    if (platform) logMessage += ` [${platform}]`;
    if (action) logMessage += ` [${action}]`;

    logMessage += `: ${message}`;

    if (stack) {
      logMessage += `\n${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      logMessage += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'healer-discovery' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),

    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true
    }),

    // Write discovery activities to discovery.log
    new winston.transports.File({
      filename: path.join(logsDir, 'discovery.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, platform, action, ...meta }) => {
          if (platform || action) {
            return `${timestamp} [${platform || 'UNKNOWN'}] [${action || 'UNKNOWN'}]: ${message}`;
          }
          return `${timestamp}: ${message}`;
        })
      )
    }),

    // Write rate limit activities to rate-limits.log
    new winston.transports.File({
      filename: path.join(logsDir, 'rate-limits.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 2,
      tailable: true
    })
  ]
});

// Enhanced logging methods
class HealerDiscoveryLogger {
  constructor() {
    this.logger = logger;
  }

  // Standard logging methods
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      ...meta,
      error: error.message,
      stack: error.stack
    } : meta;
    this.logger.error(message, errorMeta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Discovery-specific logging
  discoveryStart(platform, target) {
    this.logger.info('Discovery session started', {
      platform,
      target,
      action: 'discovery_start'
    });
  }

  discoveryComplete(platform, foundCount, duration) {
    this.logger.info(`Discovery completed: found ${foundCount} healers in ${duration}ms`, {
      platform,
      foundCount,
      duration,
      action: 'discovery_complete'
    });
  }

  healerDiscovered(healer, platform) {
    this.logger.info(`New healer discovered: ${healer.name || 'Unknown'}`, {
      platform,
      healer: {
        name: healer.name,
        email: healer.email ? '[REDACTED]' : 'None',
        location: healer.location,
        specialties: healer.specialties
      },
      action: 'healer_discovered'
    });
  }

  // Rate limiting logging
  rateLimitHit(platform, action, resetTime) {
    this.logger.warn(`Rate limit reached for ${platform} ${action}`, {
      platform,
      action: 'rate_limit_hit',
      resetTime: resetTime ? resetTime.toISOString() : 'Unknown'
    });
  }

  rateLimitCheck(platform, action, allowed, reason) {
    const level = allowed ? 'debug' : 'info';
    this.logger[level](`Rate limit check: ${allowed ? 'ALLOWED' : 'BLOCKED'}`, {
      platform,
      action,
      allowed,
      reason
    });
  }

  progressiveLimitUpdate(week, newLimit) {
    this.logger.info(`Progressive limit updated for week ${week}: ${newLimit} contacts/day`, {
      week,
      newLimit,
      action: 'progressive_update'
    });
  }

  // Outreach logging
  outreachSent(healer, campaign) {
    this.logger.info(`Outreach sent to ${healer.name || 'Unknown healer'}`, {
      platform: 'email',
      action: 'outreach_sent',
      campaign: {
        type: campaign.campaign_type,
        subject: campaign.subject,
        template: campaign.template_used
      },
      healer: {
        id: healer.id,
        name: healer.name,
        email: '[REDACTED]'
      }
    });
  }

  outreachResponse(healer, responseType) {
    this.logger.info(`Outreach response received: ${responseType}`, {
      platform: 'email',
      action: 'outreach_response',
      responseType,
      healer: {
        id: healer.id,
        name: healer.name
      }
    });
  }

  outreachError(healer, error) {
    this.logger.error(`Outreach failed to ${healer.name || 'Unknown healer'}`, error, {
      platform: 'email',
      action: 'outreach_error',
      healer: {
        id: healer.id,
        name: healer.name,
        email: '[REDACTED]'
      }
    });
  }

  // Safety and compliance logging
  emergencyStop(reason, details = {}) {
    this.logger.error(`EMERGENCY STOP ACTIVATED: ${reason}`, null, {
      action: 'emergency_stop',
      reason,
      details,
      timestamp: new Date().toISOString()
    });
  }

  weekendMode(isActive) {
    this.logger.info(`Weekend mode ${isActive ? 'ACTIVATED' : 'DEACTIVATED'}`, {
      action: 'weekend_mode',
      isActive
    });
  }

  manualApprovalRequired(healer, action) {
    this.logger.info(`Manual approval required for ${action}`, {
      action: 'manual_approval_required',
      approvalType: action,
      healer: {
        id: healer.id,
        name: healer.name
      }
    });
  }

  // Performance logging
  performanceMetric(metric, value, platform = null) {
    this.logger.info(`Performance: ${metric} = ${value}`, {
      platform,
      action: 'performance_metric',
      metric,
      value
    });
  }

  dailyReport(stats) {
    this.logger.info('Daily report generated', {
      action: 'daily_report',
      stats: {
        totalHealers: stats.totalHealers,
        newToday: stats.newToday,
        contacted: stats.contacted,
        responses: stats.responses,
        responseRate: stats.responseRate
      }
    });
  }

  // Data export logging
  exportGenerated(format, recordCount, filePath) {
    this.logger.info(`Export generated: ${recordCount} records in ${format} format`, {
      action: 'export_generated',
      format,
      recordCount,
      filePath: path.basename(filePath) // Don't log full path for privacy
    });
  }

  // Error recovery logging
  recoveryAttempt(error, attempt, maxAttempts) {
    this.logger.warn(`Recovery attempt ${attempt}/${maxAttempts} for error: ${error.message}`, {
      action: 'recovery_attempt',
      attempt,
      maxAttempts,
      error: error.message
    });
  }

  recoverySuccess(error, attempts) {
    this.logger.info(`Successfully recovered from error after ${attempts} attempts`, {
      action: 'recovery_success',
      attempts,
      originalError: error.message
    });
  }

  recoveryFailed(error, maxAttempts) {
    this.logger.error(`Recovery failed after ${maxAttempts} attempts`, error, {
      action: 'recovery_failed',
      maxAttempts
    });
  }

  // Get log file paths for external access
  getLogPaths() {
    return {
      combined: path.join(logsDir, 'combined.log'),
      error: path.join(logsDir, 'error.log'),
      discovery: path.join(logsDir, 'discovery.log'),
      rateLimits: path.join(logsDir, 'rate-limits.log')
    };
  }

  // Read recent logs (for dashboard/monitoring)
  async getRecentLogs(logType = 'combined', lines = 100) {
    return new Promise((resolve, reject) => {
      const logFile = this.getLogPaths()[logType];
      if (!logFile || !fs.existsSync(logFile)) {
        resolve([]);
        return;
      }

      const exec = require('child_process').exec;
      const command = process.platform === 'win32'
        ? `powershell "Get-Content '${logFile}' -Tail ${lines}"`
        : `tail -n ${lines} "${logFile}"`;

      exec(command, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          const logs = stdout.trim().split('\n').filter(line => line.trim());
          resolve(logs);
        }
      });
    });
  }
}

module.exports = new HealerDiscoveryLogger();