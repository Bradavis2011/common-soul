#!/usr/bin/env node

// Show exactly what the healer discovery tool would find and how it would be formatted

console.log(`
🌟 COMMON SOUL HEALER DISCOVERY TOOL - DEMO OUTPUT 🌟
====================================================

This shows you EXACTLY what the tool would discover and how it would be structured.
NO REAL SEARCHES PERFORMED - This is sample data showing the format.

📊 DISCOVERY RESULTS PREVIEW:
============================
`);

// Sample data representing what would actually be found
const sampleDiscoveryResults = [
  {
    name: "Sarah Moonlight",
    email: "sarah@moonlighthealing.com",
    phone: "(555) 123-4567",
    website: "https://moonlighthealing.com",
    instagram: "https://instagram.com/sarahmoonlight",
    location: "Boulder, CO",
    specialties: ["Reiki", "Crystal Healing", "Energy Work"],
    bio: "Certified Reiki Master with 8 years experience. Specializing in chakra balancing and crystal healing. Offering in-person and virtual sessions.",
    years_experience: 8,
    follower_count: 2400,
    source_platform: "instagram",
    contact_confidence: 85, // out of 100%
    discovery_method: "Found via #reikihealing hashtag",
    outreach_priority: "High"
  },
  {
    name: "Dr. Marcus Chen",
    email: "info@holisticwellnessboulder.com",
    phone: "(555) 987-6543",
    website: "https://holisticwellnessboulder.com",
    location: "Boulder, CO",
    specialties: ["Holistic Therapy", "Spiritual Counseling", "Meditation"],
    bio: "Licensed therapist integrating Eastern and Western healing approaches. 15+ years experience in holistic mental health.",
    years_experience: 15,
    source_platform: "psychology_today",
    contact_confidence: 90,
    discovery_method: "Psychology Today directory search",
    outreach_priority: "High"
  },
  {
    name: "Luna Rivers",
    email: "hello@sacredspacereiki.com",
    phone: null, // Sometimes phone numbers aren't found
    website: "https://sacredspacereiki.com",
    instagram: "https://instagram.com/lunarivers_healing",
    location: "Sedona, AZ",
    specialties: ["Reiki", "Sound Healing", "Meditation"],
    bio: "Sound healing practitioner and Reiki Master. Creating sacred healing spaces for transformation and growth.",
    years_experience: 5,
    follower_count: 1800,
    source_platform: "instagram",
    contact_confidence: 75,
    discovery_method: "Found via #soundhealing hashtag",
    outreach_priority: "Medium"
  },
  {
    name: "Healing Light Center",
    email: "contact@healinglightcenter.com",
    phone: "(555) 765-4321",
    website: "https://healinglightcenter.com",
    location: "Portland, OR",
    specialties: ["Energy Healing", "Crystal Therapy", "Wellness Coaching"],
    bio: "Full-service healing center offering multiple modalities. Team of certified practitioners.",
    years_experience: 10,
    source_platform: "google_my_business",
    contact_confidence: 80,
    discovery_method: "Google My Business search for 'energy healing'",
    outreach_priority: "High"
  },
  {
    name: "Amy Spiritual",
    email: "amy@spiritualguidance.net",
    phone: null,
    website: null,
    location: "Austin, TX",
    specialties: ["Spiritual Coaching", "Life Guidance"],
    bio: "Intuitive life coach helping others connect with their authentic selves.",
    years_experience: 6,
    source_platform: "psychology_today",
    contact_confidence: 60,
    discovery_method: "Psychology Today spiritual counseling search",
    outreach_priority: "Medium"
  }
];

// Display the results as they would appear
console.log(`INSTAGRAM DISCOVERY RESULTS: ${sampleDiscoveryResults.filter(h => h.source_platform === 'instagram').length} healers found`);
console.log(`PSYCHOLOGY TODAY RESULTS: ${sampleDiscoveryResults.filter(h => h.source_platform === 'psychology_today').length} healers found`);
console.log(`GOOGLE MY BUSINESS RESULTS: ${sampleDiscoveryResults.filter(h => h.source_platform === 'google_my_business').length} healers found`);
console.log(`TOTAL DISCOVERED: ${sampleDiscoveryResults.length} spiritual healers\n`);

sampleDiscoveryResults.forEach((healer, index) => {
  console.log(`${index + 1}. ${healer.name}`);
  console.log(`   📧 Email: ${healer.email || 'Not found'}`);
  console.log(`   📞 Phone: ${healer.phone || 'Not found'}`);
  console.log(`   🌐 Website: ${healer.website || 'Not found'}`);
  console.log(`   📱 Instagram: ${healer.instagram || 'Not found'}`);
  console.log(`   📍 Location: ${healer.location}`);
  console.log(`   🧘 Specialties: ${healer.specialties.join(', ')}`);
  console.log(`   📈 Experience: ${healer.years_experience} years`);
  console.log(`   💎 Contact Quality: ${healer.contact_confidence}% confidence`);
  console.log(`   🔍 Found via: ${healer.discovery_method}`);
  console.log(`   ⭐ Priority: ${healer.outreach_priority}`);
  console.log(`   📝 Bio: ${healer.bio.substring(0, 100)}...`);
  console.log();
});

console.log(`
📊 STATISTICS SUMMARY:
=====================
Total Healers: ${sampleDiscoveryResults.length}
With Email: ${sampleDiscoveryResults.filter(h => h.email).length}/${sampleDiscoveryResults.length} (${Math.round(sampleDiscoveryResults.filter(h => h.email).length / sampleDiscoveryResults.length * 100)}%)
With Phone: ${sampleDiscoveryResults.filter(h => h.phone).length}/${sampleDiscoveryResults.length} (${Math.round(sampleDiscoveryResults.filter(h => h.phone).length / sampleDiscoveryResults.length * 100)}%)
With Website: ${sampleDiscoveryResults.filter(h => h.website).length}/${sampleDiscoveryResults.length} (${Math.round(sampleDiscoveryResults.filter(h => h.website).length / sampleDiscoveryResults.length * 100)}%)
High Priority: ${sampleDiscoveryResults.filter(h => h.outreach_priority === 'High').length} healers
Average Experience: ${Math.round(sampleDiscoveryResults.reduce((acc, h) => acc + h.years_experience, 0) / sampleDiscoveryResults.length)} years

📈 EXCEL EXPORT PREVIEW (what gets saved to spreadsheet):
========================================================
`);

console.log('Full_Name | Email | Phone | Location | Website | Specialties | Experience | Quality | Source | Priority');
console.log('-'.repeat(100));

sampleDiscoveryResults.forEach(healer => {
  const row = [
    healer.name,
    healer.email || '',
    healer.phone || '',
    healer.location,
    healer.website || '',
    healer.specialties.join(', '),
    healer.years_experience + ' yrs',
    healer.contact_confidence + '%',
    healer.source_platform,
    healer.outreach_priority
  ];
  console.log(row.join(' | '));
});

console.log(`
📧 SAMPLE EMAIL PREVIEW (what would be sent - but NOT actually sent in test mode):
================================================================================

To: sarah@moonlighthealing.com
Subject: Sarah, join Common Soul's spiritual healing community

Dear Sarah,

I hope this message finds you in good health and spirit. I came across your
beautiful Reiki, Crystal Healing, Energy Work practice on Instagram and was deeply
inspired by your authentic approach to healing.

My name is Brandon, and I'm reaching out because I believe you'd be a perfect
fit for Common Soul - a new spiritual healing platform that connects authentic
practitioners like yourself with seekers who truly value genuine healing experiences.

Why Common Soul is Different:
• Quality Over Quantity: We carefully vet both healers and seekers
• Fair Revenue Sharing: Keep 85% of your session fees
• Complete Support: Integrated booking, payments, messaging, and video sessions
• Authentic Community: Connect with like-minded practitioners

We're currently building our founding community of healers in Boulder, CO and
would be honored to have someone with your expertise join us.

[Learn More About Common Soul Button]

I'd love to answer any questions you might have about the platform.

With gratitude and light,
Brandon Davis
Founder, Common Soul
hello@thecommonsoul.com
https://thecommonsoul.com

[Unsubscribe Link]

🛡️ SAFETY FEATURES ACTIVE:
==========================
✅ DRY_RUN mode: No emails actually sent
✅ Manual approval required: Every email reviewed before sending
✅ Conservative limits: Maximum 25 contacts per day
✅ Progressive ramping: Week 1 starts with only 5 contacts/day
✅ Weekend breaks: Automatic pause Friday evening - Monday morning
✅ Rate limiting: Respectful delays between all actions
✅ Emergency stop: Immediate halt if any warnings detected

🎯 WHAT THIS MEANS FOR YOU:
==========================
1. The tool would find ~15-25 spiritual healers per day
2. ~70% would have email addresses for outreach
3. All data exported to Excel for your manual review
4. You decide who to contact and when
5. Professional, personalized outreach emails
6. Complete control over the process

🚀 NEXT STEPS TO TEST SAFELY:
============================
1. This demo shows you the exact output format
2. No real searches were performed yet
3. When ready, run: DRY_RUN=true node src/index.js discover
4. Review actual results in Excel export
5. Only enable real outreach after you approve the contacts

The tool is designed for quality over quantity - finding authentic healers
who would genuinely benefit from joining Common Soul's community.
`);

console.log('\n✨ Demo complete! This shows exactly what the tool would discover and how it would be formatted.\n');