#!/usr/bin/env node

// Show exactly what data the tool would collect and how it would be structured
require('dotenv').config();

const Database = require('./src/utils/database');
const DataExporter = require('./src/export/dataExporter');

async function showSampleData() {
  console.log('📊 SAMPLE DATA PREVIEW - What the tool would find\n');

  // Create a test database with sample data
  const db = new Database('./data/sample_healers.db');

  // Wait for database to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Add sample healers that represent what the tool would actually find
  const sampleHealers = [
    {
      name: "Sarah moonlight",
      email: "sarah@moonlighthealing.com",
      phone: "+15551234567",
      website: "https://moonlighthealing.com",
      instagram: "https://instagram.com/sarahmoonlight",
      location: "Boulder, CO",
      specialties: ["Reiki", "Crystal Healing", "Energy Work"],
      bio: "Certified Reiki Master with 8 years experience. Specializing in chakra balancing and crystal healing. Offering in-person and virtual sessions.",
      years_experience: 8,
      certifications: ["Reiki Master", "Crystal Healing Certification"],
      follower_count: 2400,
      engagement_rate: 0.045,
      source_platform: "instagram",
      contact_confidence: 0.85,
      notes: "Discovered via Instagram hashtag #reikihealing. Active profile with professional content."
    },
    {
      name: "Dr. Marcus Chen",
      email: "info@holisticwellnessboulder.com",
      phone: "+15559876543",
      website: "https://holisticwellnessboulder.com",
      location: "Boulder, CO",
      specialties: ["Holistic Therapy", "Spiritual Counseling", "Meditation"],
      bio: "Licensed therapist integrating Eastern and Western healing approaches. 15+ years experience in holistic mental health.",
      years_experience: 15,
      certifications: ["Licensed Clinical Social Worker", "Mindfulness-Based Therapy"],
      source_platform: "psychology_today",
      contact_confidence: 0.90,
      notes: "Found on Psychology Today. Licensed professional with established practice."
    },
    {
      name: "Luna Rivers",
      email: "hello@sacredspacereiki.com",
      phone: "+15558765432",
      website: "https://sacredspacereiki.com",
      instagram: "https://instagram.com/lunarivers_healing",
      location: "Sedona, AZ",
      specialties: ["Reiki", "Sound Healing", "Meditation"],
      bio: "Sound healing practitioner and Reiki Master. Creating sacred healing spaces for transformation and growth.",
      years_experience: 5,
      certifications: ["Reiki Master", "Sound Healing Practitioner"],
      follower_count: 1800,
      source_platform: "instagram",
      contact_confidence: 0.75,
      notes: "Discovered via Instagram. Excellent content quality and engagement."
    },
    {
      name: "Healing Light Center",
      email: "contact@healinglightcenter.com",
      phone: "+15557654321",
      website: "https://healinglightcenter.com",
      location: "Portland, OR",
      specialties: ["Energy Healing", "Crystal Therapy", "Wellness Coaching"],
      bio: "Full-service healing center offering multiple modalities. Team of certified practitioners providing personalized healing experiences.",
      years_experience: 10,
      certifications: ["Various practitioner certifications"],
      source_platform: "google_my_business",
      contact_confidence: 0.80,
      notes: "Found on Google My Business. Established healing center with good reviews."
    },
    {
      name: "Amy Spiritual",
      email: "amy@spiritualguidance.net",
      location: "Austin, TX",
      specialties: ["Spiritual Coaching", "Life Guidance", "Meditation"],
      bio: "Intuitive life coach helping others connect with their authentic selves. Offering guidance for spiritual awakening and personal growth.",
      years_experience: 6,
      source_platform: "psychology_today",
      contact_confidence: 0.60,
      notes: "Found on Psychology Today directory. No phone number found, email only."
    }
  ];

  console.log('Adding sample healer data to database...\n');

  // Add sample data to database
  for (const healer of sampleHealers) {
    try {
      await db.addHealer(healer);
    } catch (error) {
      // Ignore duplicate key errors
      if (!error.message.includes('UNIQUE constraint')) {
        console.error('Error adding healer:', error.message);
      }
    }
  }

  console.log('✅ Sample data added to database\n');

  // Show what the export would look like
  console.log('📊 EXPORT PREVIEW - Excel/CSV Output\n');
  console.log('='.repeat(80));

  const exporter = new DataExporter(db);
  const exportData = await exporter.exportHealers();

  if (exportData) {
    console.log(`\n📁 Sample Export Created: ${exportData.filename}`);
    console.log(`📈 Total Records: ${exportData.recordCount}`);

    // Show first few rows of what would be exported
    console.log('\n📋 SAMPLE SPREADSHEET CONTENTS:');
    console.log('=' .repeat(50));

    const healers = await db.getHealers({ limit: 3 });

    healers.forEach((healer, i) => {
      console.log(`\nROW ${i + 1}:`);
      console.log(`Full_Name: ${healer.name}`);
      console.log(`Email: ${healer.email || 'Not found'}`);
      console.log(`Phone: ${healer.phone || 'Not found'}`);
      console.log(`Location: ${healer.location || 'Not specified'}`);
      console.log(`Website: ${healer.website || 'Not found'}`);
      console.log(`Instagram: ${healer.instagram || 'Not found'}`);
      console.log(`Specialties: ${(healer.specialties || []).join(', ')}`);
      console.log(`Years_Experience: ${healer.years_experience || 'Not specified'}`);
      console.log(`Contact_Quality: ${Math.round((healer.contact_confidence || 0.5) * 100)}%`);
      console.log(`Source: ${healer.source_platform}`);
      console.log(`Notes: ${healer.notes || 'No additional notes'}`);
    });
  }

  // Show statistics
  console.log('\n📈 DISCOVERY STATISTICS:');
  console.log('=' .repeat(30));

  const stats = await db.getStats();
  console.log(`Total Healers Found: ${stats.totalHealers?.[0]?.count || 0}`);

  if (stats.byPlatform && stats.byPlatform.length > 0) {
    console.log('\nBy Platform:');
    stats.byPlatform.forEach(platform => {
      console.log(`  ${platform.source_platform}: ${platform.count} healers`);
    });
  }

  const healersWithEmail = await db.getHealers();
  const withEmail = healersWithEmail.filter(h => h.email).length;
  const withPhone = healersWithEmail.filter(h => h.phone).length;
  const withWebsite = healersWithEmail.filter(h => h.website).length;

  console.log(`\nContact Information Found:`);
  console.log(`  With Email: ${withEmail}/${healersWithEmail.length} (${Math.round(withEmail/healersWithEmail.length*100)}%)`);
  console.log(`  With Phone: ${withPhone}/${healersWithEmail.length} (${Math.round(withPhone/healersWithEmail.length*100)}%)`);
  console.log(`  With Website: ${withWebsite}/${healersWithEmail.length} (${Math.round(withWebsite/healersWithEmail.length*100)}%)`);

  // Show what email would look like (but not send it)
  console.log('\n📧 SAMPLE EMAIL PREVIEW (NOT SENT):');
  console.log('=' .repeat(40));

  const EmailAutomation = require('./src/outreach/emailAutomation');
  const emailAutomation = new EmailAutomation(db, null, {
    smtp: { auth: { user: 'test', pass: 'test' } }, // Fake credentials for preview
    from: { name: 'Common Soul Team', address: 'hello@thecommonsoul.com' }
  });

  // Show what a personalized email would look like
  const sampleHealer = healersWithEmail[0];
  if (sampleHealer) {
    const template = emailAutomation.getInitialOutreachTemplate();
    const { subject, html } = emailAutomation.personalizeEmail(template, sampleHealer, 'initial_outreach');

    console.log(`To: ${sampleHealer.email}`);
    console.log(`Subject: ${subject}`);
    console.log(`\nEmail Content (first 500 characters):`);
    console.log('-'.repeat(50));
    const textVersion = emailAutomation.htmlToText(html);
    console.log(textVersion.substring(0, 500) + '...\n');
  }

  console.log('🎯 SUMMARY:');
  console.log('=' .repeat(15));
  console.log('✅ This shows exactly what the tool would discover');
  console.log('✅ No actual websites were scraped (this is sample data)');
  console.log('✅ No emails were sent');
  console.log('✅ Data is exported to Excel/CSV for your review');
  console.log('✅ You have full control over who gets contacted');

  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Review the sample data above');
  console.log('2. If this looks good, run actual discovery: node src/index.js discover');
  console.log('3. Export real results: node src/index.js export');
  console.log('4. Manually review Excel file before any outreach');
  console.log('5. Enable outreach only after you approve the contacts');

  // Cleanup
  db.close();
}

// Run if called directly
if (require.main === module) {
  showSampleData().catch(console.error);
}

module.exports = { showSampleData };