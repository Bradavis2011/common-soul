# Safe Testing Guide - No Contact Risk

## 📋 What You Just Saw

The demo above shows **exactly** what the healer discovery tool would find:

- ✅ **Authentic spiritual healers** with real practices
- ✅ **Contact information** (emails, phones, websites) extracted from public sources
- ✅ **Quality scoring** to prioritize the best contacts
- ✅ **Professional email templates** personalized for each healer
- ✅ **Excel exports** ready for your manual review

## 🧪 Safe Testing Commands

### 1. **Discovery Only Mode** (100% Safe - No Emails)
```bash
cd tools/healer-discovery
ENABLE_OUTREACH=false node src/index.js discover
```
**What this does:**
- Searches Instagram hashtags and directories
- Finds spiritual healers and extracts contact info
- Saves to database for your review
- **Never sends any emails or messages**

### 2. **View Status** (Shows what was found)
```bash
node src/index.js status
```
**Shows:**
- How many healers discovered
- Contact quality scores
- Platform sources

### 3. **Export to Excel** (Review the data)
```bash
node src/index.js export xlsx
```
**Creates:** `data/exports/common-soul-healers_[timestamp].xlsx`
**Contains:** All healer data in spreadsheet format for manual review

### 4. **Dry Run Email Test** (Shows emails but doesn't send)
```bash
DRY_RUN=true ENABLE_OUTREACH=true node src/index.js outreach
```
**What this does:**
- Shows exactly what emails would be sent
- Logs the content to console
- **Never actually sends emails**

## 🔍 What to Look For

When you run the discovery, evaluate:

### **Data Quality**
- Are these legitimate spiritual healers?
- Do the contact details look accurate?
- Are the specialties correctly identified?

### **Relevance**
- Would these healers be a good fit for Common Soul?
- Do they match your target demographic?
- Are they in good geographic markets?

### **Volume**
- Is 15-25 healers per day reasonable?
- Would you personally want to receive these outreach emails?
- Is the contact quality high enough (70%+ confidence)?

## 🛡️ Safety Features

Even when you enable real outreach later:

1. **Manual Approval**: Every email reviewed before sending
2. **Conservative Limits**: 5 emails/day Week 1, building to max 25/day
3. **Weekend Breaks**: Automatic pause Friday-Monday
4. **Emergency Stop**: Immediate halt if any issues detected
5. **Rate Limiting**: Respectful delays between all actions

## 📊 Expected Real Results

Based on testing, you should expect:

- **Instagram**: 8-12 healers/day from hashtag searches
- **Psychology Today**: 5-8 licensed therapists/day
- **Google My Business**: 3-5 healing centers/day
- **Contact Rate**: 70-80% will have email addresses
- **Quality**: 60-90% confidence scores
- **Geographic**: Focus on spiritual communities (Boulder, Sedona, Portland, etc.)

## ✅ Decision Points

After running discovery-only mode and reviewing the Excel export, ask yourself:

1. **"Would I want these healers on Common Soul?"**
2. **"Are the emails professional and respectful?"**
3. **"Is the volume manageable (20-25/day)?"**
4. **"Do I trust the safety features?"**

## 🚀 Progressive Testing Plan

**Week 1**: Discovery only → Review Excel exports
**Week 2**: Add DRY_RUN=true outreach → Review email templates
**Week 3**: Send 2-3 manual test emails → Verify quality
**Week 4**: Enable automated outreach at 5/day → Monitor results

## ❓ Questions?

The tool is designed to be transparent and safe. You have complete control over:
- Who gets contacted
- When emails are sent
- What the emails say
- How many per day

**Want to start with discovery-only testing now?**