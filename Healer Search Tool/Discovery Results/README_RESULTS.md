# 🔍 Healer Discovery Results

## 📁 Folder Structure

```
Discovery Results/
├── databases/          # SQLite databases with discovered healers
├── exports/           # Excel/CSV files ready for review
├── logs/              # Discovery activity logs
└── README_RESULTS.md  # This file
```

## 📋 Naming Convention

### Database Files
- `healers_discovery_YYYY-MM-DD_HH-mm.db` - Full discovery run
- `healers_test_YYYY-MM-DD.db` - Test runs

### Export Files
- `healer_contacts_YYYY-MM-DD_HH-mm.xlsx` - Excel format (recommended)
- `healer_contacts_YYYY-MM-DD_HH-mm.csv` - CSV format
- `healer_contacts_high_priority_YYYY-MM-DD.xlsx` - High-quality contacts only
- `healer_contacts_by_specialty_YYYY-MM-DD.xlsx` - Filtered by healing type

### Log Files
- `discovery_YYYY-MM-DD.log` - Discovery activity details
- `rate_limits_YYYY-MM-DD.log` - Safety monitoring
- `errors_YYYY-MM-DD.log` - Any issues encountered

## 🎯 What Each File Contains

### Database Files
- Full healer profiles with all discovered data
- Contact information (emails, phones, websites)
- Specialties and experience levels
- Source platform and discovery method
- Quality confidence scores

### Export Files (Excel/CSV)
**Columns include:**
- Full_Name, Email, Phone, Location
- Website, Instagram, Specialties
- Years_Experience, Contact_Quality
- Source_Platform, Discovery_Date
- Outreach_Priority, Best_Contact_Method
- Notes and Bio excerpts

### Log Files
- Real-time discovery progress
- Rate limiting and safety checks
- Platform-specific results
- Error handling and recovery

## 📊 Quality Indicators

**High Priority Contacts** (80%+ confidence):
- Professional website available
- Valid email address found
- Established practice (2+ years)
- Clear spiritual healing specialties

**Medium Priority Contacts** (60-79% confidence):
- Some contact information available
- Relevant healing practices
- Active social media presence

**Research Required** (<60% confidence):
- Limited contact information
- Unclear specialization
- Newer practitioners

## 🔍 How to Review Results

1. **Check Discovery Summary**: Look at log files first
2. **Open Excel Export**: Review full contact list
3. **Filter by Priority**: Focus on High priority contacts
4. **Validate Manually**: Verify websites/social profiles
5. **Plan Outreach**: Use data for recruitment campaigns

## 📈 Expected Results Per Run

- **Total Healers**: 15-25 per discovery session
- **With Email**: ~70% of discovered healers
- **High Priority**: ~30-40% of total
- **Geographic Spread**: Focus on spiritual communities
- **Specialty Mix**: Reiki (40%), Energy Healing (30%), Crystal/Sound/Other (30%)

---

**All results are for Common Soul healer recruitment purposes only**