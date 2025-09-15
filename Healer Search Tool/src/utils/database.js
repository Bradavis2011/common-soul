const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor(dbPath = './data/healers.db') {
    this.dbPath = path.resolve(dbPath);

    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = null;
    this.init();
  }

  init() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const healersTable = `
      CREATE TABLE IF NOT EXISTS healers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        website TEXT,
        instagram TEXT,
        location TEXT,
        specialties TEXT, -- JSON array
        bio TEXT,
        years_experience INTEGER,
        certifications TEXT, -- JSON array
        profile_image_url TEXT,
        follower_count INTEGER,
        engagement_rate REAL,
        source_platform TEXT,
        discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        contact_confidence REAL DEFAULT 0.5, -- 0-1 scale
        status TEXT DEFAULT 'discovered', -- discovered, contacted, responded, interested, applied, onboarded
        last_contacted DATETIME,
        response_received BOOLEAN DEFAULT FALSE,
        notes TEXT
      )
    `;

    const campaignsTable = `
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        healer_id INTEGER,
        campaign_type TEXT, -- discovery, outreach_1, outreach_2, outreach_3
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        subject TEXT,
        template_used TEXT,
        delivery_status TEXT DEFAULT 'sent', -- sent, delivered, opened, clicked, replied, bounced
        response_received BOOLEAN DEFAULT FALSE,
        response_text TEXT,
        response_date DATETIME,
        FOREIGN KEY (healer_id) REFERENCES healers (id)
      )
    `;

    const rateLimitsTable = `
      CREATE TABLE IF NOT EXISTS rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT,
        action_type TEXT, -- discovery, outreach, extraction
        action_count INTEGER DEFAULT 0,
        date TEXT, -- YYYY-MM-DD format
        last_action DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const settingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(healersTable);
    this.db.run(campaignsTable);
    this.db.run(rateLimitsTable);
    this.db.run(settingsTable);

    // Initialize default settings
    this.initializeSettings();
  }

  initializeSettings() {
    const defaultSettings = [
      ['daily_contact_limit', '25'],
      ['current_week', '1'],
      ['progressive_limit', '5'],
      ['manual_approval_required', 'true'],
      ['weekend_mode', 'true'],
      ['platform_rotation_day', '0']
    ];

    defaultSettings.forEach(([key, value]) => {
      this.db.run(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    });
  }

  // Healer operations
  async addHealer(healerData) {
    return new Promise((resolve, reject) => {
      const {
        name, email, phone, website, instagram, location,
        specialties, bio, years_experience, certifications,
        profile_image_url, follower_count, engagement_rate,
        source_platform, contact_confidence, notes
      } = healerData;

      const query = `
        INSERT OR REPLACE INTO healers (
          name, email, phone, website, instagram, location,
          specialties, bio, years_experience, certifications,
          profile_image_url, follower_count, engagement_rate,
          source_platform, contact_confidence, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(query, [
        name, email, phone, website, instagram, location,
        JSON.stringify(specialties || []), bio, years_experience,
        JSON.stringify(certifications || []), profile_image_url,
        follower_count, engagement_rate, source_platform,
        contact_confidence, notes
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getHealers(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM healers WHERE 1=1';
      const params = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.source_platform) {
        query += ' AND source_platform = ?';
        params.push(filters.source_platform);
      }

      if (filters.min_confidence) {
        query += ' AND contact_confidence >= ?';
        params.push(filters.min_confidence);
      }

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      query += ' ORDER BY discovered_at DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields
          const healers = rows.map(row => ({
            ...row,
            specialties: JSON.parse(row.specialties || '[]'),
            certifications: JSON.parse(row.certifications || '[]')
          }));
          resolve(healers);
        }
      });
    });
  }

  async updateHealerStatus(healerId, status, notes = null) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE healers
        SET status = ?, notes = COALESCE(?, notes), last_contacted = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(query, [status, notes, healerId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Rate limiting operations
  async checkRateLimit(platform, actionType, dailyLimit) {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];

      this.db.get(
        'SELECT action_count FROM rate_limits WHERE platform = ? AND action_type = ? AND date = ?',
        [platform, actionType, today],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            const currentCount = row ? row.action_count : 0;
            resolve(currentCount < dailyLimit);
          }
        }
      );
    });
  }

  async incrementRateLimit(platform, actionType) {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];

      const query = `
        INSERT INTO rate_limits (platform, action_type, date, action_count)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(platform, action_type, date) DO UPDATE SET
        action_count = action_count + 1,
        last_action = CURRENT_TIMESTAMP
      `;

      // SQLite doesn't support ON CONFLICT, so we'll use INSERT OR REPLACE
      this.db.get(
        'SELECT action_count FROM rate_limits WHERE platform = ? AND action_type = ? AND date = ?',
        [platform, actionType, today],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            this.db.run(
              'UPDATE rate_limits SET action_count = action_count + 1, last_action = CURRENT_TIMESTAMP WHERE platform = ? AND action_type = ? AND date = ?',
              [platform, actionType, today],
              function(updateErr) {
                if (updateErr) {
                  reject(updateErr);
                } else {
                  resolve(this.changes);
                }
              }
            );
          } else {
            this.db.run(
              'INSERT INTO rate_limits (platform, action_type, date, action_count) VALUES (?, ?, ?, 1)',
              [platform, actionType, today],
              function(insertErr) {
                if (insertErr) {
                  reject(insertErr);
                } else {
                  resolve(this.lastID);
                }
              }
            );
          }
        }
      );
    });
  }

  // Campaign operations
  async logCampaign(campaignData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO campaigns (healer_id, campaign_type, subject, template_used, delivery_status)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(query, [
        campaignData.healer_id,
        campaignData.campaign_type,
        campaignData.subject,
        campaignData.template_used,
        campaignData.delivery_status || 'sent'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Settings operations
  async getSetting(key) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.value : null);
        }
      });
    });
  }

  async setSetting(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, value],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  // Analytics
  async getStats() {
    return new Promise((resolve, reject) => {
      const queries = {
        totalHealers: 'SELECT COUNT(*) as count FROM healers',
        byStatus: `
          SELECT status, COUNT(*) as count
          FROM healers
          GROUP BY status
          ORDER BY count DESC
        `,
        byPlatform: `
          SELECT source_platform, COUNT(*) as count
          FROM healers
          GROUP BY source_platform
          ORDER BY count DESC
        `,
        todaysActivity: `
          SELECT platform, action_type, SUM(action_count) as count
          FROM rate_limits
          WHERE date = date('now')
          GROUP BY platform, action_type
        `,
        responseRate: `
          SELECT
            COUNT(*) as total_contacted,
            SUM(CASE WHEN response_received THEN 1 ELSE 0 END) as responses,
            ROUND(
              (SUM(CASE WHEN response_received THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
              2
            ) as response_rate
          FROM healers
          WHERE status IN ('contacted', 'responded', 'interested', 'applied', 'onboarded')
        `
      };

      const stats = {};
      let completed = 0;
      const total = Object.keys(queries).length;

      Object.entries(queries).forEach(([key, query]) => {
        this.db.all(query, [], (err, rows) => {
          if (err) {
            console.error(`Error running ${key} query:`, err);
          } else {
            stats[key] = rows;
          }

          completed++;
          if (completed === total) {
            resolve(stats);
          }
        });
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = Database;