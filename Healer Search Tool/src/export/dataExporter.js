const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const logger = require('../utils/logger');

class DataExporter {
  constructor(database, config = {}) {
    this.db = database;
    this.config = {
      exportDir: './Discovery Results/exports',
      defaultFormat: 'xlsx',
      includeHeaders: true,
      timestampFormat: 'YYYY-MM-DD_HH-mm-ss',
      // Mail merge friendly column names
      columnMappings: {
        name: 'Full_Name',
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        website: 'Website',
        instagram: 'Instagram',
        specialties: 'Specialties',
        bio: 'Bio',
        years_experience: 'Years_Experience',
        certifications: 'Certifications',
        follower_count: 'Followers',
        contact_confidence: 'Contact_Quality',
        source_platform: 'Source',
        discovered_at: 'Discovered_Date',
        status: 'Status',
        notes: 'Notes'
      },
      ...config
    };

    // Ensure export directory exists
    this.ensureExportDir();
  }

  ensureExportDir() {
    if (!fs.existsSync(this.config.exportDir)) {
      fs.mkdirSync(this.config.exportDir, { recursive: true });
      logger.info(`Created export directory: ${this.config.exportDir}`);
    }
  }

  async exportHealers(filters = {}, format = null) {
    try {
      const exportFormat = format || this.config.defaultFormat;
      logger.info(`Starting ${exportFormat.toUpperCase()} export with filters`, {
        action: 'export_start',
        format: exportFormat,
        filters
      });

      // Get healers from database
      const healers = await this.db.getHealers(filters);

      if (healers.length === 0) {
        logger.warn('No healers found matching filters', { filters });
        return null;
      }

      // Prepare data for export
      const exportData = this.prepareExportData(healers);

      // Generate filename
      const timestamp = moment().format(this.config.timestampFormat);
      const filterSuffix = this.generateFilterSuffix(filters);
      const filename = `healer-contacts_${timestamp}${filterSuffix}.${exportFormat}`;
      const filePath = path.join(this.config.exportDir, filename);

      // Export based on format
      let result;
      switch (exportFormat.toLowerCase()) {
        case 'xlsx':
          result = await this.exportToExcel(exportData, filePath);
          break;
        case 'csv':
          result = await this.exportToCSV(exportData, filePath);
          break;
        default:
          throw new Error(`Unsupported export format: ${exportFormat}`);
      }

      logger.exportGenerated(exportFormat, healers.length, filePath);

      return {
        filePath,
        filename,
        recordCount: healers.length,
        format: exportFormat,
        ...result
      };

    } catch (error) {
      logger.error('Export failed', error, {
        action: 'export_failed',
        format: format || this.config.defaultFormat,
        filters
      });
      throw error;
    }
  }

  prepareExportData(healers) {
    return healers.map(healer => {
      const exportRow = {};

      // Map database fields to mail-merge friendly names
      Object.entries(this.config.columnMappings).forEach(([dbField, exportField]) => {
        let value = healer[dbField];

        // Special formatting for specific fields
        switch (dbField) {
          case 'specialties':
          case 'certifications':
            value = Array.isArray(value) ? value.join(', ') : (value || '');
            break;

          case 'discovered_at':
            value = value ? moment(value).format('MM/DD/YYYY') : '';
            break;

          case 'contact_confidence':
            value = value ? Math.round(value * 100) + '%' : '50%';
            break;

          case 'bio':
            value = value ? this.truncateText(value, 200) : '';
            break;

          case 'follower_count':
            value = value ? this.formatNumber(value) : '';
            break;

          case 'phone':
            value = this.formatPhoneForExport(value);
            break;

          case 'email':
            value = value || '';
            break;

          default:
            value = value || '';
        }

        exportRow[exportField] = value;
      });

      // Add computed fields for outreach
      exportRow.Outreach_Priority = this.calculateOutreachPriority(healer);
      exportRow.Best_Contact_Method = this.determineBestContactMethod(healer);
      exportRow.Platform_Profile_URL = this.generateProfileUrl(healer);
      exportRow.Outreach_Template = this.suggestOutreachTemplate(healer);

      return exportRow;
    });
  }

  async exportToExcel(data, filePath) {
    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const columnWidths = this.calculateColumnWidths(data);
      worksheet['!cols'] = columnWidths;

      // Add conditional formatting information (as comments since XLSX doesn't support conditional formatting)
      this.addExcelFormatting(worksheet, data);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Common Soul Healers');

      // Add summary sheet
      const summarySheet = this.createSummarySheet(data);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Write file
      XLSX.writeFile(workbook, filePath);

      return {
        success: true,
        worksheets: ['Common Soul Healers', 'Summary'],
        features: ['Auto-sized columns', 'Summary statistics', 'Mail merge ready']
      };

    } catch (error) {
      logger.error('Excel export failed', error, { filePath });
      throw error;
    }
  }

  async exportToCSV(data, filePath) {
    try {
      // Define CSV headers from first data row
      const headers = Object.keys(data[0]).map(key => ({
        id: key,
        title: key
      }));

      // Create CSV writer
      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers
      });

      // Write data
      await csvWriter.writeRecords(data);

      return {
        success: true,
        headers: headers.length,
        encoding: 'utf8',
        features: ['Mail merge ready', 'Universal compatibility']
      };

    } catch (error) {
      logger.error('CSV export failed', error, { filePath });
      throw error;
    }
  }

  calculateColumnWidths(data) {
    if (data.length === 0) return [];

    const widths = {};
    const headers = Object.keys(data[0]);

    // Initialize with header lengths
    headers.forEach(header => {
      widths[header] = header.length;
    });

    // Calculate maximum content length for each column
    data.forEach(row => {
      headers.forEach(header => {
        const cellValue = String(row[header] || '');
        widths[header] = Math.max(widths[header], cellValue.length);
      });
    });

    // Convert to Excel column width format (with reasonable limits)
    return headers.map(header => ({
      wch: Math.min(Math.max(widths[header], 10), 50)
    }));
  }

  addExcelFormatting(worksheet, data) {
    // Add comments to indicate high-priority contacts
    let row = 2; // Start from row 2 (after headers)

    data.forEach(healer => {
      if (healer.Outreach_Priority === 'High') {
        const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: 0 }); // First column
        if (!worksheet[cellRef]) worksheet[cellRef] = { v: healer.Full_Name };
        worksheet[cellRef].c = [{
          a: 'System',
          t: 'High priority contact - excellent fit for Common Soul'
        }];
      }
      row++;
    });
  }

  createSummarySheet(data) {
    const summary = this.generateSummaryStats(data);

    const summaryData = [
      { Metric: 'Total Healers', Value: summary.total },
      { Metric: 'With Email Address', Value: summary.withEmail },
      { Metric: 'With Phone Number', Value: summary.withPhone },
      { Metric: 'High Priority Contacts', Value: summary.highPriority },
      { Metric: 'Instagram Discovered', Value: summary.fromInstagram },
      { Metric: 'Website Available', Value: summary.withWebsite },
      { Metric: '', Value: '' }, // Spacer
      { Metric: 'Top Specialties:', Value: '' },
      ...Object.entries(summary.specialties).slice(0, 5).map(([specialty, count]) => ({
        Metric: `  ${specialty}`, Value: count
      })),
      { Metric: '', Value: '' }, // Spacer
      { Metric: 'Export Generated', Value: moment().format('MM/DD/YYYY HH:mm') },
      { Metric: 'Platform', Value: 'Common Soul Healer Discovery Tool' }
    ];

    return XLSX.utils.json_to_sheet(summaryData);
  }

  generateSummaryStats(data) {
    const stats = {
      total: data.length,
      withEmail: 0,
      withPhone: 0,
      highPriority: 0,
      fromInstagram: 0,
      withWebsite: 0,
      specialties: {}
    };

    data.forEach(healer => {
      if (healer.Email) stats.withEmail++;
      if (healer.Phone) stats.withPhone++;
      if (healer.Outreach_Priority === 'High') stats.highPriority++;
      if (healer.Source === 'instagram') stats.fromInstagram++;
      if (healer.Website) stats.withWebsite++;

      // Count specialties
      if (healer.Specialties) {
        const specialties = healer.Specialties.split(', ');
        specialties.forEach(specialty => {
          if (specialty.trim()) {
            stats.specialties[specialty.trim()] = (stats.specialties[specialty.trim()] || 0) + 1;
          }
        });
      }
    });

    return stats;
  }

  calculateOutreachPriority(healer) {
    let score = 0;

    // Has email contact
    if (healer.email) score += 3;

    // Has website
    if (healer.website) score += 2;

    // Good contact confidence
    if (healer.contact_confidence >= 0.7) score += 2;

    // Professional specialties
    const highValueSpecialties = ['Reiki', 'Energy Healing', 'Crystal Healing', 'Spiritual Coaching'];
    if (healer.specialties && highValueSpecialties.some(spec =>
      healer.specialties.includes(spec))) {
      score += 2;
    }

    // Good follower range (engaged but not celebrity)
    if (healer.follower_count >= 500 && healer.follower_count <= 10000) {
      score += 1;
    }

    // Experience indicator
    if (healer.years_experience >= 2) score += 1;

    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  }

  determineBestContactMethod(healer) {
    if (healer.email && healer.phone) return 'Email + Phone';
    if (healer.email) return 'Email';
    if (healer.phone) return 'Phone';
    if (healer.instagram) return 'Instagram DM';
    if (healer.website) return 'Website Contact Form';
    return 'Research Required';
  }

  generateProfileUrl(healer) {
    if (healer.instagram) return healer.instagram;
    if (healer.website) return healer.website;
    return '';
  }

  suggestOutreachTemplate(healer) {
    const specialties = healer.specialties || [];

    if (specialties.includes('Reiki')) return 'Reiki_Master_Template';
    if (specialties.includes('Crystal Healing')) return 'Crystal_Healer_Template';
    if (specialties.includes('Spiritual Coaching')) return 'Spiritual_Coach_Template';
    if (specialties.includes('Energy Healing')) return 'Energy_Healer_Template';

    return 'General_Healer_Template';
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatPhoneForExport(phone) {
    if (!phone) return '';

    // Remove country code for cleaner display in mail merge
    const cleaned = phone.replace(/^\+1/, '').replace(/[^\d]/g, '');

    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }

    return phone; // Return original if can't format
  }

  generateFilterSuffix(filters) {
    const parts = [];

    if (filters.status) parts.push(filters.status);
    if (filters.source_platform) parts.push(filters.source_platform);
    if (filters.min_confidence) parts.push(`conf${Math.round(filters.min_confidence * 100)}`);

    return parts.length > 0 ? `_${parts.join('_')}` : '';
  }

  // Quick export methods for common use cases
  async exportForEmailCampaign() {
    return await this.exportHealers({
      min_confidence: 0.6,
      status: 'discovered'
    }, 'csv');
  }

  async exportHighPriorityContacts() {
    const healers = await this.db.getHealers({ min_confidence: 0.7 });
    const highPriority = healers.filter(h =>
      h.email && (h.specialties || '').includes('Reiki') ||
      (h.specialties || '').includes('Energy Healing')
    );

    if (highPriority.length === 0) return null;

    const exportData = this.prepareExportData(highPriority);
    const timestamp = moment().format(this.config.timestampFormat);
    const filename = `high-priority-healers_${timestamp}.xlsx`;
    const filePath = path.join(this.config.exportDir, filename);

    await this.exportToExcel(exportData, filePath);

    return {
      filePath,
      filename,
      recordCount: highPriority.length,
      format: 'xlsx'
    };
  }

  async exportBySpecialty(specialty) {
    const healers = await this.db.getHealers();
    const specialtyHealers = healers.filter(h =>
      (h.specialties || '').toLowerCase().includes(specialty.toLowerCase())
    );

    if (specialtyHealers.length === 0) return null;

    return await this.exportHealers({
      specialty: specialty.toLowerCase()
    }, 'xlsx');
  }

  // Get available export files
  getExportFiles() {
    try {
      const files = fs.readdirSync(this.config.exportDir)
        .filter(file => file.endsWith('.xlsx') || file.endsWith('.csv'))
        .map(file => {
          const filePath = path.join(this.config.exportDir, file);
          const stats = fs.statSync(filePath);

          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            format: path.extname(file).slice(1)
          };
        })
        .sort((a, b) => b.created - a.created);

      return files;
    } catch (error) {
      logger.error('Error reading export files', error);
      return [];
    }
  }
}

module.exports = DataExporter;