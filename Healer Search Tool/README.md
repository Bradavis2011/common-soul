# Common Soul Healer Discovery Tool

A conservative, safety-first healer discovery and outreach automation tool designed specifically for Common Soul's spiritual healing marketplace recruitment.

## 🎯 Purpose

Discover and recruit qualified spiritual healers for the Common Soul platform using ethical, sustainable automation practices. Built with strict rate limiting and human behavior simulation to avoid platform bans.

## ⚡ Key Features

- **Conservative Rate Limiting**: 20-25 contacts per day maximum
- **Multi-Platform Discovery**: Instagram, Psychology Today, wellness directories
- **Email Validation & Enrichment**: High-quality contact data
- **Excel/CSV Export**: Ready for mail merge campaigns
- **CRM Integration**: Track healer recruitment pipeline
- **Human Behavior Simulation**: Weekend breaks, random delays
- **Manual Approval**: All outreach reviewed before sending

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Valid email account for outreach
- Instagram account (6+ months old recommended)

### Installation

```bash
cd tools/healer-discovery
npm install
cp .env.example .env
# Edit .env with your credentials
```

### Basic Usage

```bash
# Start full discovery pipeline
npm start

# Run individual components
npm run discover  # Discovery only
npm run extract   # Contact extraction
npm run outreach  # Email campaigns
npm run export    # Export to Excel/CSV
```

## 📊 Conservative Limits

### Daily Targets (Progressive)
- **Week 1**: 5-10 contacts/day (learning phase)
- **Week 2**: 10-15 contacts/day (scaling)
- **Week 3**: 15-20 contacts/day (optimization)
- **Week 4**: 20-25 contacts/day (full operation)

### Platform Limits
- **Instagram**: 10-12 profiles/day, 60-180s delays
- **Email Outreach**: 20-25 emails/day, 3-4 hour gaps
- **Directory Scraping**: 15-20 profiles/day total
- **Weekend Breaks**: Automatic pause Friday evening - Monday morning

## 🎯 Target Healers

### Specialties (Matching Common Soul)
- Reiki Masters & Energy Healers
- Crystal & Gemstone Therapists
- Spiritual Life Coaches
- Meditation & Mindfulness Teachers
- Chakra Balancing Specialists
- Sound & Vibrational Healers
- Tarot Readers & Astrologers

### Quality Filters
- 2+ years experience preferred
- Professional website/portfolio
- Active social media presence
- Valid contact information
- Location in target markets

## 📁 Project Structure

```
healer-discovery/
├── src/
│   ├── discovery/          # Platform scrapers
│   ├── extraction/         # Contact extraction
│   ├── outreach/          # Email automation
│   ├── export/            # Data export
│   ├── utils/             # Shared utilities
│   └── index.js           # Main entry point
├── config/                # Configuration files
├── data/                 # Database & exports
├── logs/                 # Application logs
└── templates/            # Email templates
```

## 🛡️ Safety Features

### Rate Limiting
- Configurable daily/hourly limits
- Automatic cooldown periods
- Platform rotation scheduling
- Emergency stop mechanisms

### Human Behavior Simulation
- Random delays between actions
- Weekend inactivity simulation
- Varied timing patterns
- Progressive ramping

### Compliance
- Manual approval workflows
- Unsubscribe handling
- Data privacy protection
- Platform ToS compliance

## 📈 Expected Results

### Realistic Metrics
- **Response Rate**: 20-30% (spiritual community is engaged)
- **Application Rate**: 5-10% of responses
- **Quality Score**: 80%+ valid contact information
- **Platform Safety**: Zero bans with conservative limits

### Monthly Output
- **Total Contacts**: 400-500 qualified healers
- **Quality Applications**: 20-50 healer signups
- **Cost Efficiency**: <$2 per qualified contact
- **Time Investment**: 30 minutes daily oversight

## 🔧 Configuration

Key settings in `.env`:

```bash
DAILY_CONTACT_LIMIT=25           # Conservative daily limit
MANUAL_APPROVAL_REQUIRED=true    # Review before sending
PROGRESSIVE_RAMPING=true         # Start slow, scale up
WEEKEND_MODE=true               # Pause on weekends
```

## 📝 Usage Workflow

### Daily Operations (30 minutes)
1. **Morning Review**: Check overnight discoveries
2. **Contact Validation**: Verify new contacts
3. **Outreach Approval**: Review/approve email queue
4. **Performance Check**: Monitor metrics dashboard

### Weekly Tasks
1. **Template Optimization**: A/B test email content
2. **Market Expansion**: Add new geographic regions
3. **Performance Review**: Analyze response rates
4. **Safety Audit**: Check platform compliance

## 🎯 Integration with Common Soul

### Healer Categories
Automatically tags discovered healers with Common Soul specialties:
- Energy Healing
- Crystal Therapy
- Spiritual Coaching
- Meditation Instruction
- Alternative Healing

### Pipeline Integration
Direct integration with Common Soul healer onboarding:
- Export formats match registration system
- Pre-filled application links
- Automated follow-up sequences
- CRM synchronization

## 🚨 Important Notes

### Platform Safety
- Uses only established accounts (6+ months)
- Respects all platform rate limits
- Implements human behavior patterns
- Monitors for ban warnings

### Legal Compliance
- GDPR-compliant data handling
- CAN-SPAM Act compliance
- Ethical recruitment practices
- Transparent opt-out mechanisms

### Quality Focus
- Prioritizes quality over quantity
- Manual verification of all contacts
- Continuous improvement based on results
- Sustainable growth approach

## 📞 Support

For issues or questions:
- Check logs in `./logs/`
- Review configuration in `.env`
- Contact Common Soul development team

---

**Built for Common Soul's mission of connecting authentic healers with those seeking spiritual growth** 🌟