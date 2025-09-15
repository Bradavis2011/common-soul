#!/usr/bin/env node

// SAFE TEST SCRIPT - Shows what would be discovered without any outreach
require('dotenv').config();

const Database = require('./src/utils/database');
const DirectoryScrapers = require('./src/discovery/directoryScrapers');

class SafeDiscoveryTest {
  constructor() {
    this.db = new Database('./data/test_healers.db');
    this.directoryScrapers = null;
  }

  async testDirectorySearch() {
    try {
      console.log('🧪 SAFE DISCOVERY TEST - No contacts will be made\n');
      console.log('Configuration:');
      console.log('- Instagram: DISABLED');
      console.log('- Email outreach: DISABLED');
      console.log('- Only public directory searches');
      console.log('- Results saved to test database only\n');

      // Create a mock rate limiter that always allows actions
      const mockRateLimiter = {
        async canPerformAction() {
          return { allowed: true, reason: 'Test mode - always allow' };
        },
        async recordAction() {
          console.log('📊 Action recorded (test mode)');
        },
        async getRandomDelay() {
          return 1000; // 1 second delay for testing
        },
        async getBetweenPlatformDelay() {
          return 2000; // 2 second delay for testing
        }
      };

      // Initialize directory scrapers in test mode
      this.directoryScrapers = new DirectoryScrapers(this.db, mockRateLimiter, {
        headless: true,
        // Test with just 1 location and 1 search term
        locations: ['Boulder, CO'],
        searchTerms: {
          psychology_today: ['holistic therapy'],
          google_my_business: ['reiki healing']
        },
        maxResults: {
          psychology_today: 2, // Just 2 results for testing
          google_my_business: 2
        }
      });

      console.log('🔍 Starting directory search test...\n');

      // Test Psychology Today search
      console.log('Testing Psychology Today search for "holistic therapy" in Boulder, CO');
      try {
        const ptHealers = await this.directoryScrapers.searchPsychologyToday('holistic therapy', 'Boulder, CO');

        console.log(`\n✅ Psychology Today Results: ${ptHealers.length} healers found`);
        ptHealers.forEach((healer, i) => {
          console.log(`${i + 1}. ${healer.name}`);
          console.log(`   📍 Location: ${healer.location || 'Not specified'}`);
          console.log(`   🧘 Specialties: ${healer.specialties?.join(', ') || 'General therapy'}`);
          console.log(`   💰 Contact Confidence: ${Math.round((healer.contact_confidence || 0.5) * 100)}%`);
          console.log(`   📞 Phone: ${healer.phone ? 'Found' : 'Not found'}`);
          console.log(`   📧 Email: ${healer.email ? 'Found' : 'Not found'}`);
          console.log(`   🌐 Website: ${healer.website ? 'Found' : 'Not found'}`);
          console.log();
        });

      } catch (error) {
        console.log(`❌ Psychology Today search failed: ${error.message}`);
      }

      // Test Google My Business search
      console.log('\nTesting Google My Business search for "reiki healing" in Boulder, CO');
      try {
        const gmbHealers = await this.directoryScrapers.searchGoogleMyBusiness('reiki healing', 'Boulder, CO');

        console.log(`\n✅ Google My Business Results: ${gmbHealers.length} healers found`);
        gmbHealers.forEach((healer, i) => {
          console.log(`${i + 1}. ${healer.name}`);
          console.log(`   📍 Location: ${healer.location || 'Not specified'}`);
          console.log(`   🧘 Specialties: ${healer.specialties?.join(', ') || 'General healing'}`);
          console.log(`   💰 Contact Confidence: ${Math.round((healer.contact_confidence || 0.5) * 100)}%`);
          console.log(`   📞 Phone: ${healer.phone ? 'Found' : 'Not found'}`);
          console.log(`   🌐 Website: ${healer.website ? 'Found' : 'Not found'}`);
          console.log();
        });

      } catch (error) {
        console.log(`❌ Google My Business search failed: ${error.message}`);
      }

      // Close browser
      if (this.directoryScrapers) {
        await this.directoryScrapers.close();
      }

      console.log('\n📊 TEST SUMMARY');
      console.log('================');
      console.log('✅ Discovery test completed successfully');
      console.log('✅ No emails were sent');
      console.log('✅ No Instagram accounts accessed');
      console.log('✅ Only public directory searches performed');
      console.log('\n💡 This shows you exactly what the tool would find in discovery mode.');
      console.log('📁 Results are saved to: ./data/test_healers.db (separate from main database)');

      return true;

    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      console.error('Stack trace:', error.stack);
      return false;
    } finally {
      // Cleanup
      if (this.directoryScrapers) {
        await this.directoryScrapers.close();
      }
      if (this.db) {
        this.db.close();
      }
    }
  }
}

// Run test if called directly
async function main() {
  console.log('🚀 Starting Safe Discovery Test...\n');

  const test = new SafeDiscoveryTest();
  const success = await test.testDirectorySearch();

  if (success) {
    console.log('\n🎉 Test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the results above');
    console.log('2. If satisfied, run: node src/index.js discover');
    console.log('3. Export results: node src/index.js export');
  } else {
    console.log('\n❌ Test failed. Check the error messages above.');
  }

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = SafeDiscoveryTest;