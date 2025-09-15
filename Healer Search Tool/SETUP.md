# Common Soul Healer Discovery Tool - Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Gmail account with App Password enabled
- Instagram account (6+ months old recommended)

### 2. Installation

```bash
cd tools/healer-discovery
npm install
```

### 3. Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_PATH=./data/healers.db

# Email Configuration (Gmail recommended)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM_NAME=Common Soul Team

# Instagram (Optional - for discovery)
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password

# Conservative Rate Limits
DAILY_CONTACT_LIMIT=25
INSTAGRAM_PROFILES_PER_DAY=12
EMAIL_DAILY_LIMIT=25

# Safety Settings
MANUAL_APPROVAL_REQUIRED=true
WEEKEND_MODE=true
PROGRESSIVE_RAMPING=true

# Common Soul Settings
PLATFORM_NAME=Common Soul
PLATFORM_URL=https://thecommonsoul.com
SIGNUP_URL=https://thecommonsoul.com/register
CONTACT_EMAIL=hello@thecommonsoul.com
```

### 4. First Run (Test Mode)

Test the setup without sending emails:
```bash
DRY_RUN=true npm start
```

### 5. Production Run

Start full discovery pipeline:
```bash
npm start
```

## Detailed Setup Instructions

### Gmail App Password Setup

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security → App passwords
3. Generate app password for "Mail"
4. Use this password (not your regular Gmail password) in `.env`

### Instagram Account Setup

1. Use an established Instagram account (6+ months old)
2. Ensure account has normal activity history
3. Don't use business accounts with automation flags
4. Consider using a dedicated account for discovery

### Progressive Ramping Schedule

The tool automatically implements conservative ramping:

- **Week 1**: 5 contacts/day (learning phase)
- **Week 2**: 8 contacts/day (gradual increase)
- **Week 3**: 12 contacts/day (building momentum)
- **Week 4**: 20-25 contacts/day (full operation)

### Safety Features

#### Rate Limiting
- Instagram: 12 profiles/day maximum
- Email: 25 emails/day maximum
- Directory searches: 15 profiles/day total
- Weekend breaks automatically enabled

#### Manual Approval
- First 2 weeks require manual email approval
- Review generated emails in logs before sending
- Disable with `MANUAL_APPROVAL_REQUIRED=false`

#### Emergency Stop
- Automatic stop if platforms show warnings
- Manual emergency stop: Set `emergency_stop=true` in database
- Clear with: `npm run clear-emergency`

## Usage Commands

### Discovery Only
```bash
npm run discover
```
Finds healers without sending emails.

### Outreach Only
```bash
npm run outreach
```
Sends emails to discovered healers (requires existing database).

### Export Data
```bash
npm run export
# or specify format
node src/index.js export csv
```

### Check Status
```bash
node src/index.js status
```

### Full Pipeline
```bash
npm start
# or
node src/index.js run
```

## Directory Structure

```
healer-discovery/
├── src/
│   ├── discovery/          # Instagram & directory scrapers
│   ├── extraction/         # Contact extraction & validation
│   ├── outreach/          # Email automation
│   ├── export/            # Excel/CSV export
│   ├── utils/             # Database, logging, rate limiting
│   └── index.js           # Main entry point
├── data/                  # Database and exports
├── logs/                  # Application logs
├── templates/             # Email templates (auto-generated)
└── config/               # Configuration files
```

## Monitoring & Logs

### Log Files
- `logs/combined.log` - All activity
- `logs/discovery.log` - Discovery activities
- `logs/rate-limits.log` - Rate limit tracking
- `logs/error.log` - Errors only

### Real-time Monitoring
```bash
# Follow discovery activity
tail -f logs/discovery.log

# Monitor rate limits
tail -f logs/rate-limits.log

# Watch for errors
tail -f logs/error.log
```

### Performance Metrics
The tool tracks:
- Healers discovered per platform
- Email delivery rates
- Contact quality scores
- Response rates (manual tracking)

## Email Templates

### Default Templates
- `initial_outreach.html` - First contact
- `followup_1.html` - Week 2 follow-up
- `followup_2.html` - Final follow-up
- `reiki_master.html` - Reiki-specific outreach
- `crystal_healer.html` - Crystal healing focused
- `spiritual_coach.html` - Coaching focused

### Customization
Edit templates in `templates/` directory. Use these variables:
- `{{firstName}}` - Healer's first name
- `{{specialties}}` - Healing specialties
- `{{location}}` - Geographic location
- `{{platformUrl}}` - Common Soul URL
- `{{signupUrl}}` - Registration URL

## Database Management

### SQLite Database
Location: `data/healers.db`

### View Data
```bash
npm run db:studio
# Opens Prisma Studio web interface
```

### Backup Database
```bash
cp data/healers.db data/healers_backup_$(date +%Y%m%d).db
```

### Reset Database
```bash
rm data/healers.db
npm start  # Will recreate with fresh schema
```

## Troubleshooting

### Common Issues

#### "Email credentials not configured"
- Verify `.env` has correct `EMAIL_USER` and `EMAIL_PASS`
- Use Gmail App Password, not regular password
- Check SMTP settings match your email provider

#### "Instagram login failed"
- Use established account (6+ months old)
- Don't use accounts with previous automation
- Consider manual login to clear captchas
- Try without Instagram: `ENABLE_INSTAGRAM=false`

#### "Rate limit exceeded"
- Normal behavior - tool will wait and retry
- Check `logs/rate-limits.log` for details
- Reduce limits in `.env` if needed

#### "No healers found"
- Check internet connection
- Verify Instagram/directory sites are accessible
- Look for errors in `logs/error.log`
- Try discovery-only mode: `npm run discover`

### Performance Issues

#### Slow discovery
- Reduce `INSTAGRAM_PROFILES_PER_DAY`
- Increase delays between actions
- Check network speed

#### Memory usage
- Close unused browser instances
- Restart tool daily for long-running operations
- Monitor with `htop` or Task Manager

### Email Issues

#### Emails not sending
- Verify SMTP credentials
- Check Gmail "Less secure apps" setting
- Test with `DRY_RUN=true` first
- Monitor `logs/error.log` for SMTP errors

#### Low response rates
- Review email templates for personalization
- Check spam folder placement
- Ensure professional sender reputation
- A/B test different subject lines

## Security Best Practices

### Credential Management
- Never commit `.env` to version control
- Use strong, unique passwords
- Rotate Instagram passwords regularly
- Monitor for unauthorized access

### Rate Limiting Compliance
- Never exceed platform rate limits
- Respect robots.txt files
- Use delays that simulate human behavior
- Stop immediately if accounts get warnings

### Data Privacy
- Store healer data securely
- Implement unsubscribe mechanisms
- Comply with GDPR/CCPA requirements
- Delete data upon request

## Production Deployment

### Server Setup
- Linux VPS with 2GB+ RAM recommended
- Node.js 18+ installed
- PM2 for process management
- Daily database backups

### Automated Scheduling
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/index.js --name "healer-discovery" --cron "0 9 * * 1-5"

# Monitor
pm2 monit
```

### Maintenance Schedule
- Weekly: Review logs and performance metrics
- Bi-weekly: Update email templates based on responses
- Monthly: Backup database and rotate credentials
- Quarterly: Update dependencies and security patches

## Support

For issues or questions:
- Check `logs/error.log` first
- Review this setup guide
- Check Common Soul documentation
- Contact the development team

Remember: This tool is designed for sustainable, ethical healer recruitment. Always prioritize quality relationships over quantity of contacts.