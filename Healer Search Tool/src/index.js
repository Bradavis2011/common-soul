#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import core modules
const Database = require('./utils/database');
const ConservativeRateLimiter = require('./utils/rateLimiter');
const logger = require('./utils/logger');

// Import discovery modules
const InstagramDiscovery = require('./discovery/instagramDiscovery');
const DirectoryScrapers = require('./discovery/directoryScrapers');

// Import processing modules
const ContactExtractor = require('./extraction/contactExtractor');
const EmailAutomation = require('./outreach/emailAutomation');
const DataExporter = require('./export/dataExporter');

class CommonSoulHealerDiscovery {
  constructor() {
    this.config = {
      // Progressive ramping settings
      startingWeek: 1,
      maxWeeks: 4,

      // Current operation mode
      dryRun: process.env.DRY_RUN === 'true',

      // Component enable/disable
      enableInstagram: process.env.ENABLE_INSTAGRAM !== 'false',
      enableDirectories: process.env.ENABLE_DIRECTORIES !== 'false',
      enableOutreach: process.env.ENABLE_OUTREACH !== 'false',

      // Daily targets by week
      weeklyTargets: {
        1: { discovery: 5, outreach: 5 },
        2: { discovery: 10, outreach: 10 },
        3: { discovery: 15, outreach: 15 },
        4: { discovery: 20, outreach: 20 }
      }
    };

    // Initialize core components
    this.db = null;
    this.rateLimiter = null;
    this.instagramDiscovery = null;
    this.directoryScrapers = null;
    this.contactExtractor = null;
    this.emailAutomation = null;
    this.dataExporter = null;

    this.isInitialized = false;
  }

  async initialize() {
    try {
      logger.info('Initializing Common Soul Healer Discovery Tool', {
        action: 'initialization',
        version: require('../package.json').version
      });

      // Initialize database
      this.db = new Database(process.env.DATABASE_PATH);
      await this.sleep(1000); // Allow database to initialize

      // Initialize rate limiter
      this.rateLimiter = new ConservativeRateLimiter(this.db);

      // Initialize discovery modules
      if (this.config.enableInstagram) {
        this.instagramDiscovery = new InstagramDiscovery(this.db, this.rateLimiter);
      }

      if (this.config.enableDirectories) {
        this.directoryScrapers = new DirectoryScrapers(this.db, this.rateLimiter);
      }

      // Initialize processing modules
      this.contactExtractor = new ContactExtractor(this.db, this.rateLimiter);
      this.dataExporter = new DataExporter(this.db);

      if (this.config.enableOutreach) {
        this.emailAutomation = new EmailAutomation(this.db, this.rateLimiter);
      }

      this.isInitialized = true;
      logger.info('Common Soul Healer Discovery Tool initialized successfully', {
        action: 'initialization_complete',
        components: {
          instagram: !!this.instagramDiscovery,
          directories: !!this.directoryScrapers,
          outreach: !!this.emailAutomation,
          dryRun: this.config.dryRun
        }
      });

    } catch (error) {
      logger.error('Initialization failed', error);
      throw error;
    }
  }

  async runFullDiscoveryPipeline() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info('Starting full discovery pipeline', { action: 'pipeline_start' });

      // Check if emergency stop is active
      if (await this.rateLimiter.isEmergencyStopped()) {
        const reason = await this.db.getSetting('emergency_reason');
        logger.error(`Emergency stop is active: ${reason}`, null, { action: 'emergency_stop_check' });
        return { success: false, reason: 'Emergency stop active' };
      }

      // Get current week and targets
      const currentWeek = parseInt(await this.db.getSetting('current_week') || '1');
      const targets = this.config.weeklyTargets[currentWeek] || this.config.weeklyTargets[4];

      logger.info(`Running pipeline for week ${currentWeek}`, {
        action: 'pipeline_week',
        week: currentWeek,
        targets
      });

      const results = {
        week: currentWeek,
        discovery: { total: 0, instagram: 0, directories: 0 },
        enrichment: { processed: 0, withContacts: 0 },
        outreach: { sent: 0, failed: 0 },
        export: null
      };

      // Phase 1: Discovery
      logger.info('Phase 1: Healer Discovery', { action: 'phase_1_start' });

      const discoveredHealers = [];

      // Instagram discovery
      if (this.instagramDiscovery) {
        try {
          const instagramHealers = await this.instagramDiscovery.discover();
          discoveredHealers.push(...instagramHealers);
          results.discovery.instagram = instagramHealers.length;
          logger.performanceMetric('instagram_healers_discovered', instagramHealers.length, 'instagram');

          // Close Instagram browser to free resources
          await this.instagramDiscovery.close();

        } catch (error) {
          logger.error('Instagram discovery failed', error, { platform: 'instagram' });
        }
      }

      // Directory discovery
      if (this.directoryScrapers) {
        try {
          const directoryHealers = await this.directoryScrapers.discoverFromDirectories();
          discoveredHealers.push(...directoryHealers);
          results.discovery.directories = directoryHealers.length;
          logger.performanceMetric('directory_healers_discovered', directoryHealers.length, 'directories');

          // Close directory browser
          await this.directoryScrapers.close();

        } catch (error) {
          logger.error('Directory discovery failed', error, { platform: 'directories' });
        }
      }

      results.discovery.total = discoveredHealers.length;

      // Phase 2: Contact Enrichment
      logger.info('Phase 2: Contact Enrichment', { action: 'phase_2_start' });

      if (discoveredHealers.length > 0) {
        try {
          const enrichedHealers = await this.contactExtractor.batchEnrichHealers(discoveredHealers);
          const withContacts = enrichedHealers.filter(h => h.email || h.phone).length;

          results.enrichment.processed = enrichedHealers.length;
          results.enrichment.withContacts = withContacts;

          logger.performanceMetric('healers_enriched', enrichedHealers.length);
          logger.performanceMetric('contacts_found', withContacts);

          // Update database with enriched data
          for (const healer of enrichedHealers) {
            try {
              await this.db.addHealer(healer);
            } catch (dbError) {
              if (!dbError.message.includes('UNIQUE constraint')) {
                logger.error('Database update error during enrichment', dbError);
              }
            }
          }

        } catch (error) {
          logger.error('Contact enrichment failed', error);
        }
      }

      // Phase 3: Outreach (if enabled and not dry run)
      if (this.emailAutomation && !this.config.dryRun) {
        logger.info('Phase 3: Email Outreach', { action: 'phase_3_start' });

        try {
          const outreachResult = await this.emailAutomation.scheduleDailyOutreach();

          if (outreachResult.skipped) {
            logger.info(`Outreach skipped: ${outreachResult.reason}`, { action: 'outreach_skipped' });
          } else {
            results.outreach.sent = outreachResult.summary?.successful || 0;
            results.outreach.failed = outreachResult.summary?.failed || 0;

            logger.performanceMetric('outreach_emails_sent', results.outreach.sent, 'email');
          }

        } catch (error) {
          logger.error('Email outreach failed', error, { platform: 'email' });
        }
      }

      // Phase 4: Export
      logger.info('Phase 4: Data Export', { action: 'phase_4_start' });

      try {
        const exportResult = await this.dataExporter.exportForEmailCampaign();
        results.export = exportResult;

        if (exportResult) {
          logger.performanceMetric('records_exported', exportResult.recordCount);
        }

      } catch (error) {
        logger.error('Data export failed', error);
      }

      // Generate daily report
      const stats = await this.db.getStats();
      logger.dailyReport({
        totalHealers: stats.totalHealers?.[0]?.count || 0,
        newToday: results.discovery.total,
        contacted: results.outreach.sent,
        responses: 0, // Would need to implement response tracking
        responseRate: '0%'
      });

      logger.info('Full discovery pipeline complete', {
        action: 'pipeline_complete',
        results
      });

      return { success: true, results };

    } catch (error) {
      logger.error('Discovery pipeline failed', error, { action: 'pipeline_failed' });

      // Check if we should activate emergency stop
      if (error.message.includes('rate limit') || error.message.includes('banned')) {
        await this.rateLimiter.emergencyStop(error.message);
      }

      throw error;
    }
  }

  async runDiscoveryOnly() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info('Running discovery-only mode', { action: 'discovery_only_start' });

      const healers = [];

      // Instagram discovery
      if (this.instagramDiscovery) {
        const instagramHealers = await this.instagramDiscovery.discover();
        healers.push(...instagramHealers);
        await this.instagramDiscovery.close();
      }

      // Directory discovery
      if (this.directoryScrapers) {
        const directoryHealers = await this.directoryScrapers.discoverFromDirectories();
        healers.push(...directoryHealers);
        await this.directoryScrapers.close();
      }

      // Basic enrichment
      const enrichedHealers = await this.contactExtractor.batchEnrichHealers(healers);

      logger.info(`Discovery complete: found ${enrichedHealers.length} healers`, {
        action: 'discovery_complete',
        total: enrichedHealers.length,
        withContacts: enrichedHealers.filter(h => h.email || h.phone).length
      });

      return enrichedHealers;

    } catch (error) {
      logger.error('Discovery-only mode failed', error);
      throw error;
    }
  }

  async runOutreachOnly() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.emailAutomation) {
        throw new Error('Email automation not enabled');
      }

      logger.info('Running outreach-only mode', { action: 'outreach_only_start' });

      const result = await this.emailAutomation.scheduleDailyOutreach();

      logger.info('Outreach-only complete', {
        action: 'outreach_only_complete',
        result
      });

      return result;

    } catch (error) {
      logger.error('Outreach-only mode failed', error);
      throw error;
    }
  }

  async exportData(format = 'xlsx', filters = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`Exporting data in ${format} format`, { action: 'export_start', format, filters });

      const result = await this.dataExporter.exportHealers(filters, format);

      if (result) {
        logger.info(`Export complete: ${result.filename}`, {
          action: 'export_complete',
          filename: result.filename,
          records: result.recordCount
        });
      }

      return result;

    } catch (error) {
      logger.error('Data export failed', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const rateLimiterStatus = await this.rateLimiter.getStatus();
      const stats = await this.db.getStats();

      return {
        initialized: this.isInitialized,
        rateLimiter: rateLimiterStatus,
        database: {
          totalHealers: stats.totalHealers?.[0]?.count || 0,
          byStatus: stats.byStatus || [],
          byPlatform: stats.byPlatform || [],
          todaysActivity: stats.todaysActivity || []
        },
        components: {
          instagram: !!this.instagramDiscovery,
          directories: !!this.directoryScrapers,
          outreach: !!this.emailAutomation
        },
        config: {
          dryRun: this.config.dryRun,
          currentWeek: rateLimiterStatus.currentWeek,
          progressiveLimit: rateLimiterStatus.progressiveLimit
        }
      };

    } catch (error) {
      logger.error('Status check failed', error);
      return { error: error.message };
    }
  }

  async cleanup() {
    try {
      logger.info('Cleaning up resources', { action: 'cleanup' });

      if (this.instagramDiscovery) {
        await this.instagramDiscovery.close();
      }

      if (this.directoryScrapers) {
        await this.directoryScrapers.close();
      }

      if (this.db) {
        this.db.close();
      }

      logger.info('Cleanup complete', { action: 'cleanup_complete' });

    } catch (error) {
      logger.error('Cleanup failed', error);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const tool = new CommonSoulHealerDiscovery();

  try {
    switch (command) {
      case 'run':
      case 'start':
        await tool.runFullDiscoveryPipeline();
        break;

      case 'discover':
        const healers = await tool.runDiscoveryOnly();
        console.log(`\nFound ${healers.length} healers:`);
        healers.slice(0, 5).forEach(h => {
          console.log(`- ${h.name} (${h.specialties?.join(', ') || 'Unknown'}) - ${h.source_platform}`);
        });
        break;

      case 'outreach':
        await tool.runOutreachOnly();
        break;

      case 'export':
        const format = args[1] || 'xlsx';
        const result = await tool.exportData(format);
        if (result) {
          console.log(`\nExported ${result.recordCount} records to ${result.filename}`);
        } else {
          console.log('No data to export');
        }
        break;

      case 'status':
        const status = await tool.getStatus();
        console.log('\nCommon Soul Healer Discovery Status:');
        console.log(`- Total Healers: ${status.database?.totalHealers || 0}`);
        console.log(`- Current Week: ${status.config?.currentWeek || 1}`);
        console.log(`- Daily Limit: ${status.config?.progressiveLimit || 5}`);
        console.log(`- Weekend Mode: ${status.rateLimiter?.weekendMode ? 'Active' : 'Inactive'}`);
        console.log(`- Emergency Stop: ${status.rateLimiter?.emergencyStop ? 'Active' : 'Inactive'}`);
        break;

      case 'help':
      default:
        console.log(`
Common Soul Healer Discovery Tool

Usage:
  node src/index.js [command]

Commands:
  run, start    Run full discovery pipeline (discovery + outreach + export)
  discover      Run discovery only (no outreach)
  outreach      Run outreach only (no discovery)
  export [fmt]  Export data (xlsx/csv)
  status        Show current status
  help          Show this help

Environment Variables:
  DRY_RUN=true           Don't send emails, just log what would be sent
  ENABLE_INSTAGRAM=false Disable Instagram discovery
  ENABLE_DIRECTORIES=false Disable directory discovery
  ENABLE_OUTREACH=false  Disable email outreach

Examples:
  node src/index.js run              # Full pipeline
  node src/index.js discover         # Discovery only
  node src/index.js export csv       # Export to CSV
  DRY_RUN=true node src/index.js run # Dry run mode
        `);
        break;
    }

  } catch (error) {
    console.error('\nError:', error.message);
    console.error('\nFor help: node src/index.js help');
    process.exit(1);
  } finally {
    await tool.cleanup();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = CommonSoulHealerDiscovery;