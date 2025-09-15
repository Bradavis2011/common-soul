# 🔍 Common Soul - Healer Search Tool

**Location**: `/Healer Search Tool/`
**Purpose**: Discover and contact spiritual healers for Common Soul marketplace recruitment

## 🎯 What This Tool Does

Finds spiritual healers from multiple sources and exports their contact information for recruitment outreach:

- **Instagram**: Searches hashtags like #reikihealing, #crystalhealing, #energywork
- **Psychology Today**: Licensed therapists specializing in holistic/spiritual approaches
- **Google My Business**: Local healing centers and wellness practices
- **Website Scraping**: Extracts emails and phone numbers from healer websites

## ✅ Safety Features

- **Discovery-only mode**: Find healers without contacting anyone
- **Conservative limits**: Maximum 25 contacts/day, starts at 5/day
- **Manual approval**: Review every email before sending
- **Weekend breaks**: Automatic pause Friday evening - Monday morning
- **Rate limiting**: Respectful delays between all actions
- **Emergency stop**: Immediate halt if any issues detected

## 🚀 Quick Commands

### Safe Testing (No Emails Sent)
```bash
cd "Healer Search Tool"

# Run discovery demo
node run-healer-discovery.js

# Full discovery (no emails)
ENABLE_OUTREACH=false node src/index.js discover

# Export results to Excel
node src/index.js export xlsx

# Check what was found
node src/index.js status
```

### Email Preview (Shows emails but doesn't send)
```bash
DRY_RUN=true ENABLE_OUTREACH=true node src/index.js outreach
```

## 📊 Expected Results

**Daily Discovery**: 15-25 qualified spiritual healers
- Instagram: 8-12 healers (from hashtag searches)
- Psychology Today: 5-8 licensed therapists
- Google My Business: 3-5 healing centers

**Contact Quality**:
- 70-80% will have email addresses
- 60-80% contact confidence scores
- Geographic focus: Boulder, Sedona, Portland, Austin, etc.

**Excel Output**: `healer-contacts_[timestamp].xlsx`
- Full contact details and specialties
- Priority scoring (High/Medium/Low)
- Mail-merge ready format

## 🔧 Configuration

Edit `.env` file for settings:

```env
# Safety settings
ENABLE_OUTREACH=false      # No emails sent
DRY_RUN=true              # Test mode
ENABLE_INSTAGRAM=false    # Disable Instagram searches

# Conservative limits
DAILY_CONTACT_LIMIT=25    # Max contacts per day
EMAIL_DAILY_LIMIT=25      # Max emails per day
```

## 📁 Output Files

All outputs clearly labeled as healer-related:

- **Database**: `data/healer-discoveries.db`
- **Excel Export**: `data/exports/healer-contacts_[timestamp].xlsx`
- **Logs**: `logs/discovery.log`, `logs/rate-limits.log`

## 📧 Email Templates

Professional templates specifically for Common Soul:

- **Initial Outreach**: Introduces Common Soul platform
- **Follow-ups**: 2 additional touchpoints over 3 weeks
- **Specialty Templates**: Customized for Reiki Masters, Crystal Healers, etc.

Sample subject lines:
- "Sarah, join Common Soul's spiritual healing community"
- "Invitation for experienced Reiki practitioners"
- "Connect with seekers on Common Soul platform"

## 🎯 Target Healers

**Specialties**: Reiki, Crystal Healing, Energy Work, Spiritual Coaching, Sound Therapy, Meditation, Chakra Balancing

**Quality Filters**:
- 2+ years experience preferred
- Professional website/social presence
- Valid contact information
- Geographic focus on spiritual communities

## ⚡ Progressive Ramping

**Week 1**: 5 healers/day (learning phase)
**Week 2**: 8 healers/day (building confidence)
**Week 3**: 15 healers/day (scaling up)
**Week 4**: 20-25 healers/day (full operation)

## 🛡️ Compliance

- Uses only publicly available information
- Respects platform rate limits and terms of service
- Includes unsubscribe links in all emails
- GDPR/CAN-SPAM compliant
- Manual approval for all outreach

## 🔍 Monitoring

**Real-time logs**:
```bash
tail -f logs/discovery.log     # Watch discovery activity
tail -f logs/rate-limits.log   # Monitor safety limits
```

**Performance tracking**:
- Healers discovered per platform
- Contact quality scores
- Email delivery rates
- Response rates (manual tracking)

## 📈 Success Metrics

**Expected Results**:
- **Monthly Output**: 400-500 qualified healer contacts
- **Response Rate**: 20-30% (spiritual community is engaged)
- **Application Rate**: 5-10% of responses become Common Soul healers
- **Platform Safety**: Zero account bans with conservative approach

## 🤝 Integration with Common Soul

**Healer Categories** (matches Common Soul database):
- Energy Healing
- Crystal Therapy
- Spiritual Coaching
- Meditation Instruction
- Alternative Healing

**Export Format**: Compatible with Common Soul healer onboarding system

**Email Templates**: Professional Common Soul branding with:
- Platform URL: https://thecommonsoul.com
- Contact: hello@thecommonsoul.com
- Sign-up: https://thecommonsoul.com/register

---

**Built specifically for Common Soul's mission of connecting authentic healers with seekers on their spiritual journey** 🌟