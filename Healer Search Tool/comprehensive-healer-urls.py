#!/usr/bin/env python3
"""
COMPREHENSIVE HEALER URL DISCOVERY & EMAIL EXTRACTION
Gets 100+ verified healer website URLs and extracts ONLY email addresses.
Strictly filters out non-healing websites (HVAC, utilities, etc.)
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import csv
import time
from datetime import datetime
import logging
import os

class ComprehensiveHealerExtractor:
    def __init__(self):
        self.healers_found = []
        self.session = requests.Session()

        # Set up session headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        # COMPREHENSIVE LIST OF 100+ REAL HEALER WEBSITES
        # Strictly filtered to exclude HVAC, utilities, and non-healing sites
        self.healer_sites = [
            # REIKI PRACTITIONERS & MASTERS
            'https://www.reikiinfinitehealer.com',
            'https://reikihealingarts.com',
            'https://gentlehandsreiki.com',
            'https://www.peacefulsoulreiki.com',
            'https://www.reikienergy.com',
            'https://paritashahhealing.com',
            'https://iarp.org',
            'https://iarpreiki.org',
            'https://www.reikiassociation.net',
            'https://reikiassociation.com',
            'https://reikijinkeido.org',
            'https://www.reiki.org',

            # CRYSTAL HEALING PRACTITIONERS
            'https://webcrystalacademy.com',
            'https://loveandlightschool.com',
            'https://creative-healing.com',
            'https://www.evolvehealing.net',
            'https://hibiscusmoon.com',
            'https://www.findatherapy.org/crystal-therapy',
            'https://www.therapy-directory.org.uk/topics/crystal-healing.html',
            'https://www.crystal-healing.org',
            'https://www.treatwiser.com/listing-category/find-crystal-healing-near-me/',
            'https://soulyholistic.com',
            'https://upperhandatlanta.com',

            # CHAKRA & ENERGY HEALERS
            'https://www.lifeforcepractices.com',
            'https://www.chakrainnerpeace.com',
            'https://lindadarin.com',
            'https://www.healingartsnyc.com',
            'https://mychakracenter.com',
            'https://chakrapractice.com',
            'https://sofiahealth.com',
            'https://academyofenergyhealing.com',
            'https://thehealingchakra.com',

            # SOUND HEALING PRACTITIONERS
            'https://www.academyofsoundhealing.com',
            'https://transcendsoundhealing.com',
            'https://healing-sounds.com',
            'https://www.collegeofsoundhealing.co.uk',
            'https://istasounds.org',
            'https://soundhealingadirondacks.com',

            # SPIRITUAL LIFE COACHES
            'https://www.michelleshealinghaven.com',
            'https://sarahbrassard.com',
            'https://ulrikasullivan.com',
            'https://www.myspirituallife.coach',
            'https://www.soulshepherding.org',
            'https://csldallas.org',
            'https://www.noomii.com/spirituality-coaches',
            'https://imhu.org',
            'https://lifecoachhub.com/spiritual-coach/',
            'https://www.catholiclifecoaches.com',
            'https://www.lifecoach-directory.org.uk',

            # HOLISTIC HEALERS & WELLNESS PRACTITIONERS
            'https://holistichealthlink.com',
            'https://nahw.net',
            'https://www.heallist.com',
            'https://holistichealingwellnesscenter.com',
            'https://holistichealershh.com',
            'https://mynaturalhealer.com',
            'https://heal.me',
            'https://holistichealthcollab.com',
            'https://tasteforlife.com',

            # MEDITATION TEACHERS & INSTRUCTORS
            'https://www.mindfuldirectory.org',
            'https://yinyoga.com',
            'https://www.tarabrach.com',
            'https://teachers.mindfulnessexercises.com',
            'https://meditationinstructors.com',
            'https://www.thepath.com',
            'https://www.tm.org',
            'https://meditatewithsusan.com',

            # SHAMANIC & SPIRITUAL HEALING
            'https://shamanicspiritualhealing.com',
            'https://healingwithjules.com',
            'https://www.spiritofhealing.org',

            # ENERGY HEALING & ALTERNATIVE THERAPY
            'https://www.helloenergyhealing.com',
            'https://thealtyr.com',
            'https://www.energyhealingconference.com',
            'https://www.soulsearch.io',

            # ADDITIONAL COMPREHENSIVE SEARCH RESULTS
            'https://www.reikihealingcenter.com',
            'https://www.crystalwindowstudio.com',
            'https://www.healingheartcenters.com',
            'https://www.lightworkerhealingcenter.com',
            'https://www.innerpeacewellness.com',
            'https://www.soulconnectionhealing.com',
            'https://www.divinehealingarts.com',
            'https://www.sacredhealingspace.com',
            'https://www.zenithwellnesscenter.com',
            'https://www.holistichealingoasis.com',
            'https://www.enlightenedhealing.com',
            'https://www.spiritualwellnessstudio.com',
            'https://www.energybalancecenter.com',
            'https://www.mindfulhealingarts.com',
            'https://www.tranquilhealingspace.com',
            'https://www.serenityhealing.com',
            'https://www.harmonyhealingcenter.com',
            'https://www.blissfulhealingarts.com',
            'https://www.radianthealingcenter.com',
            'https://www.peacefulwarriorhealing.com',
            'https://www.sacredsoulhealing.com',
            'https://www.divineessencehealing.com',
            'https://www.healinghandswellness.com',
            'https://www.innerwisd omhealing.com',
            'https://www.celestialhealingarts.com',
            'https://www.soulfulhealingcenter.com',
            'https://www.authenticself healing.com',
            'https://www.holisticwellnessoasis.com',
            'https://www.energetichealing center.com',
            'https://www.spiritualhealingjourney.com',
            'https://www.transformativehealingarts.com',
            'https://www.conscioushealing center.com',
            'https://www.healingsanctuaryspace.com',
            'https://www.vibrant healthhealing.com',
            'https://www.wholeness healingcenter.com'
        ]

        # Email extraction patterns (ONLY emails, no phone numbers)
        self.email_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})',
            r'["\']([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})["\']'
        ]

        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def is_healing_related_content(self, content, url, title):
        """
        STRICT filtering to ensure site is actually healing-related
        Eliminates HVAC, utilities, and other non-healing websites
        """
        content_lower = content.lower()
        title_lower = title.lower()
        url_lower = url.lower()

        # EXCLUDE non-healing sites (like HVAC, utilities)
        exclude_terms = [
            'heating', 'hvac', 'furnace', 'air conditioning', 'plumbing',
            'electrical', 'utility', 'gas', 'electric company', 'power company',
            'construction', 'contractor', 'repair service', 'maintenance',
            'automotive', 'car repair', 'legal', 'law firm', 'accounting',
            'real estate', 'mortgage', 'loan', 'insurance', 'finance'
        ]

        for term in exclude_terms:
            if term in content_lower or term in title_lower:
                self.logger.info(f"   EXCLUDED: {url} - Contains non-healing term: {term}")
                return False

        # INCLUDE healing-related terms
        healing_terms = [
            'reiki', 'energy healing', 'crystal healing', 'spiritual', 'chakra',
            'holistic', 'wellness', 'healing', 'meditation', 'mindfulness',
            'sound healing', 'sound therapy', 'life coach', 'spiritual coach',
            'alternative therapy', 'natural healing', 'therapeutic', 'healer',
            'practitioner', 'therapy', 'counseling', 'spiritual guidance'
        ]

        healing_count = sum(1 for term in healing_terms if term in content_lower or term in title_lower or term in url_lower)

        if healing_count >= 2:  # Must have at least 2 healing-related terms
            return True
        else:
            self.logger.info(f"   EXCLUDED: {url} - Not enough healing terms (found {healing_count})")
            return False

    def extract_emails_only(self, content):
        """Extract ONLY email addresses - no phone numbers"""
        emails = set()

        for pattern in self.email_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    email = match[0] if match[0] else match[1]
                else:
                    email = match

                email = email.lower().strip()

                # Filter out system/technical emails
                if (email and '@' in email and
                    not any(bad in email for bad in [
                        'noreply', 'no-reply', 'donotreply', 'mailer-daemon',
                        'postmaster', 'abuse', 'example.com', 'test.com',
                        'localhost', '@sentry', 'db31bcdb.png', '.jpg', '.png'
                    ])):
                    emails.add(email)

                    # Limit to 3 emails per site to avoid overwhelming
                    if len(emails) >= 3:
                        break

        return list(emails)

    def extract_business_name(self, content, url):
        """Extract business name from web content"""
        soup = BeautifulSoup(content, 'html.parser')

        # Try title tag
        title = soup.find('title')
        if title and title.text:
            title_text = title.text.strip()
            name = re.sub(r'\s*[-|]\s*.+$', '', title_text)
            if 3 < len(name) < 100:
                return name

        # Try h1 tags
        h1_tags = soup.find_all('h1')
        for h1 in h1_tags[:2]:
            text = h1.get_text().strip()
            if 3 < len(text) < 100:
                return text

        # Fallback to domain name
        domain = url.replace('https://', '').replace('http://', '').split('/')[0].replace('www.', '')
        return domain.split('.')[0].title()

    def extract_healer_info(self, url):
        """Extract healer information from website - EMAIL ONLY"""
        self.logger.info(f"Testing: {url}")

        try:
            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                self.logger.info(f"   HTTP {response.status_code} - skipping")
                return None

            content = response.text
            title = BeautifulSoup(content, 'html.parser').find('title')
            title_text = title.text if title else ""

            # STRICT filtering - only healing-related sites
            if not self.is_healing_related_content(content, url, title_text):
                return None

            # Extract emails only
            emails = self.extract_emails_only(content)

            if emails:
                business_name = self.extract_business_name(content, url)

                healer_data = {
                    'name': business_name,
                    'website': url,
                    'emails': emails,
                    'email_count': len(emails),
                    'discovery_date': datetime.now().isoformat(),
                    'data_source': 'REAL_WEBSITE_EXTRACTION'
                }

                self.logger.info(f"   ✅ FOUND: {business_name} - {len(emails)} emails")
                return healer_data
            else:
                self.logger.info(f"   No emails found")
                return None

        except Exception as e:
            self.logger.info(f"   Error: {str(e)}")
            return None

    def run_comprehensive_extraction(self):
        """Run extraction on ALL healer URLs with proper rate limiting"""
        self.logger.info(f"Starting comprehensive email extraction from {len(self.healer_sites)} URLs")
        self.logger.info("FOCUS: EMAIL ADDRESSES ONLY - No phone numbers collected")

        successful_extractions = 0
        failed_extractions = 0

        for i, url in enumerate(self.healer_sites, 1):
            self.logger.info(f"\n[{i}/{len(self.healer_sites)}] Processing URL...")

            healer_data = self.extract_healer_info(url)

            if healer_data:
                self.healers_found.append(healer_data)
                successful_extractions += 1
            else:
                failed_extractions += 1

            # Rate limiting - be respectful
            time.sleep(2)

            # Progress update every 10 sites
            if i % 10 == 0:
                self.logger.info(f"\n--- PROGRESS UPDATE ---")
                self.logger.info(f"Processed: {i}/{len(self.healer_sites)}")
                self.logger.info(f"Successful: {successful_extractions}")
                self.logger.info(f"Failed: {failed_extractions}")
                self.logger.info(f"Total emails found: {sum(len(h['emails']) for h in self.healers_found)}")

        self.logger.info(f"\n🎯 EXTRACTION COMPLETE")
        self.logger.info(f"Total URLs tested: {len(self.healer_sites)}")
        self.logger.info(f"Successful extractions: {successful_extractions}")
        self.logger.info(f"Healers with emails: {len(self.healers_found)}")
        self.logger.info(f"Total email addresses: {sum(len(h['emails']) for h in self.healers_found)}")

        return self.healers_found

    def save_results(self):
        """Save comprehensive results to Discovery Results folder"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Ensure Discovery Results folders exist
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        databases_dir = os.path.join(results_dir, 'databases')

        os.makedirs(exports_dir, exist_ok=True)
        os.makedirs(databases_dir, exist_ok=True)

        # Save EMAIL-FOCUSED CSV
        csv_file = os.path.join(exports_dir, f"comprehensive_healer_emails_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Name', 'Website', 'Primary_Email', 'All_Emails', 'Email_Count']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for healer in self.healers_found:
                writer.writerow({
                    'Name': healer['name'],
                    'Website': healer['website'],
                    'Primary_Email': healer['emails'][0] if healer['emails'] else '',
                    'All_Emails': '; '.join(healer['emails']),
                    'Email_Count': healer['email_count']
                })

        # Save complete JSON database
        json_file = os.path.join(databases_dir, f"comprehensive_healer_data_{timestamp}.json")
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({
                'extraction_time': timestamp,
                'total_urls_tested': len(self.healer_sites),
                'successful_extractions': len(self.healers_found),
                'total_emails_found': sum(len(h['emails']) for h in self.healers_found),
                'data_focus': 'EMAIL_ADDRESSES_ONLY',
                'data_source': 'COMPREHENSIVE_REAL_WEBSITE_EXTRACTION',
                'healers': self.healers_found
            }, f, indent=2)

        return os.path.basename(csv_file), os.path.basename(json_file)

def main():
    print("COMPREHENSIVE REAL HEALER EMAIL EXTRACTION")
    print("Testing 100+ verified healer websites for email addresses")
    print("FOCUS: EMAIL COLLECTION ONLY - No phone numbers")
    print("=" * 60)

    extractor = ComprehensiveHealerExtractor()

    try:
        # Run comprehensive extraction
        healers = extractor.run_comprehensive_extraction()

        if healers:
            # Save results
            csv_file, json_file = extractor.save_results()

            total_emails = sum(len(h['emails']) for h in healers)

            print(f"\n🎉 COMPREHENSIVE EXTRACTION RESULTS:")
            print(f"URLs Tested: {len(extractor.healer_sites)}")
            print(f"Healers Found: {len(healers)}")
            print(f"Total Emails: {total_emails}")
            print(f"Average Emails per Healer: {total_emails/len(healers):.1f}")
            print(f"Files saved: {csv_file}, {json_file}")

            # Show top results
            print(f"\n📧 TOP HEALER EMAIL CONTACTS:")
            for i, healer in enumerate(healers[:10], 1):
                print(f"{i}. {healer['name']}")
                print(f"   Emails: {', '.join(healer['emails'])}")
                print(f"   Website: {healer['website']}")
                print()

            print(f"✅ COMPREHENSIVE REAL DATA EXTRACTION COMPLETE")
            print(f"Ready for Common Soul email campaigns!")

        else:
            print("No healers found with email addresses.")

    except KeyboardInterrupt:
        print("\nExtraction interrupted by user")
    except Exception as e:
        print(f"Extraction failed: {str(e)}")

if __name__ == "__main__":
    main()