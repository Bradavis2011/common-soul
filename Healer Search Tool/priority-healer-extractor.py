#!/usr/bin/env python3
"""
PRIORITY HEALER EXTRACTOR
Process known working URLs first for faster results.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import logging
import os

class PriorityHealerExtractor:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        self.healers_found = []

        # Priority: Proven working URLs first
        self.priority_urls = [
            'https://www.reikiinfinitehealer.com',
            'https://reikihealingarts.com',
            'https://healingwithjules.com',
            'https://www.spiritofhealing.org',
            'https://gentlehandsreiki.com',
            'https://www.peacefulsoulreiki.com',
            'https://shamanicspiritualhealing.com',
            'https://www.michelleshealinghaven.com',
            'https://sarahbrassard.com',
            'https://www.helloenergyhealing.com',
            'https://webcrystalacademy.com',
            'https://loveandlightschool.com',
            'https://creative-healing.com',
            'https://www.evolvehealing.net',
            'https://www.lifeforcepractices.com',
            'https://paritashahhealing.com',
            'https://lindadarin.com',
            'https://www.chakrainnerpeace.com',
            'https://www.healingartsnyc.com',
            'https://mychakracenter.com',
            'https://www.academyofsoundhealing.com',
            'https://transcendsoundhealing.com',
            'https://healing-sounds.com',
            'https://www.energyhealingconference.com',
            'https://www.soulsearch.io',
            'https://holistichealthlink.com'
        ]

        # Extended high-probability URLs
        self.extended_urls = [
            'https://www.reikimedicine.com',
            'https://www.holistichealing.net',
            'https://www.crystalheartreiki.com',
            'https://www.spiritualhealingcenter.org',
            'https://www.chakrabalancing.net',
            'https://www.soulhealingjourney.com',
            'https://www.healinghandspractice.com',
            'https://www.zenenergyhealing.com',
            'https://www.soundbathhealing.com',
            'https://www.shamanicjourneywork.com',
            'https://www.energymedicinecenter.net',
            'https://www.spiritualguidancecenter.org',
            'https://www.meditationhealingcenter.com',
            'https://www.heartcenteredenergy.com',
            'https://www.divineenergyhealing.org',
            'https://www.sacredspacehealingarts.com',
            'https://www.innerjourneyhealingcenter.org',
            'https://www.spiritguidedhealing.com',
            'https://www.wellnessenergycenter.com',
            'https://www.compassionatehealingarts.com',
            'https://www.soulfulhealing.net',
            'https://www.healingwisdomcenter.org',
            'https://www.luminoushealing.com',
            'https://www.naturalrhythmhealing.org',
            'https://www.groundedenergypractice.net',
            'https://www.authenticenergyhealing.com',
            'https://www.serenityhealingspace.net',
            'https://www.wisehearthealing.org',
            'https://www.balancedenergycenter.com',
            'https://www.radiantenergyhealing.net',
            'https://www.peacefulhealingjourney.org',
            'https://www.gentlehealingtouch.com',
            'https://www.nurturingenergywork.net',
            'https://www.holisticwellnesscenter.org',
            'https://www.healingconnectioncenter.net',
            'https://www.wholenesshealingarts.org',
            'https://www.restorativeenergycenter.com',
            'https://www.mindfulenergyhealing.net',
            'https://www.unifiedhealingcenter.org',
            'https://www.harmonicenergycenter.net',
            'https://www.deeperhealingarts.org',
            'https://www.empoweredhealingcenter.net',
            'https://www.centeredenergypractice.org',
            'https://www.expansivehealingarts.com',
            'https://www.alignedenergyhealing.net',
            'https://www.consciousenergywork.org',
            'https://www.awakenedhealing.com',
            'https://www.intuitiveenergyarts.net',
            'https://www.connectedhealingcenter.org',
            'https://www.embodiedenergypractice.com',
            'https://www.naturalflowhealingcenter.net',
            'https://www.soulenergycenter.org',
            'https://www.heartfieldhealing.com',
            'https://www.clearenergyhealing.net',
            'https://www.sourceenergyhealing.org',
            'https://www.vitalenergypractice.com',
            'https://www.healingcirclearts.net',
            'https://www.wisdomenergyhealing.org',
            'https://www.earthenergyhealing.com',
            'https://www.lightbodyhealing.net',
            'https://www.unityhealingcenter.org',
            'https://www.presenceenergyhealing.com',
            'https://www.truehealingarts.net',
            'https://www.divinealignmentcenter.org',
            'https://www.pureenergyhealingcenter.com',
            'https://www.infinitehealingpotential.net',
            'https://www.energyevolutionhealing.org'
        ]

        # Additional professional directories and schools
        self.directory_urls = [
            'https://www.internationalreikiassociation.com',
            'https://www.reikimastertraining.com',
            'https://www.energyhealingschool.com',
            'https://www.intuitivehealingacademy.com',
            'https://www.soundhealinginstitute.com',
            'https://www.shamanicinstitute.org',
            'https://www.spiritualhealingacademy.com',
            'https://www.holistichealingtraining.com',
            'https://www.energyworkerschool.com',
            'https://www.crystalhealingcertification.com',
            'https://www.chakrahealingschool.com',
            'https://www.pranichealinginstitute.com',
            'https://www.quantumhealingacademy.com',
            'https://www.spiritualguidancetraining.com',
            'https://www.meditationteachercertification.com',
            'https://www.wellnesscoachtraining.org',
            'https://www.holistictherapyschool.com',
            'https://www.energymedicinetraining.net',
            'https://www.healingartsinstitute.org',
            'https://www.spiritualcounselortraining.com'
        ]

        logging.basicConfig(level=logging.INFO, format='%(message)s')
        self.logger = logging.getLogger(__name__)

    def extract_contact_info(self, url):
        """Extract contact information from healer website"""
        self.logger.info(f"Processing: {url}")

        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return None

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Check if healing-related
            if not self.is_healing_related_content(content.lower()):
                return None

            # Extract emails
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, content, re.IGNORECASE)

            # Clean emails
            clean_emails = []
            for email in emails:
                email = email.lower()
                if (email not in clean_emails and
                    '@' in email and
                    not any(bad in email for bad in [
                        'noreply', 'example.', 'test@', 'admin@', 'info@godaddy',
                        'support@', 'no-reply', 'donotreply', '@sentry', '@wixpress',
                        '@2x.', '.png', '.jpg', '.gif', '@sentry.io', '@wup1rsxzoe'
                    ]) and
                    '.' in email.split('@')[1] and
                    len(email.split('@')[1]) > 3):
                    clean_emails.append(email)
                    if len(clean_emails) >= 2:
                        break

            # Extract business name
            title_tag = soup.find('title')
            if title_tag:
                business_name = title_tag.get_text().strip()
                business_name = re.sub(r'\s*[-|]\s*.+$', '', business_name)
                business_name = business_name[:80]
            else:
                business_name = url.split('//')[1].split('/')[0].replace('www.', '')

            if clean_emails:
                return {
                    'name': business_name,
                    'website': url,
                    'emails': clean_emails,
                    'found_at': datetime.now().isoformat()
                }

        except Exception as e:
            pass

        return None

    def is_healing_related_content(self, content):
        """Check if website content is healing-related"""
        exclude_terms = [
            'heating', 'hvac', 'furnace', 'air conditioning', 'plumbing',
            'electrical', 'utility', 'gas', 'electric company', 'contractor',
            'construction', 'real estate', 'insurance', 'financial',
            'automotive', 'restaurant', 'retail', 'shopping', 'domain for sale',
            'this domain', 'parked domain', 'coming soon'
        ]

        healing_terms = [
            'reiki', 'energy healing', 'spiritual healing', 'chakra',
            'crystal healing', 'holistic', 'wellness', 'meditation',
            'shamanic', 'intuitive', 'psychic', 'therapeutic touch',
            'healing touch', 'pranic healing', 'sound healing',
            'vibrational healing', 'biofield', 'alternative healing',
            'life coach', 'spiritual guidance', 'energy work'
        ]

        if any(term in content for term in exclude_terms):
            return False

        return any(term in content for term in healing_terms)

    def run_priority_extraction(self):
        """Process URLs in priority order"""
        self.logger.info("Priority Healer Extractor - Processing known working sites first")
        self.logger.info("=" * 70)

        # Process in priority order
        all_urls = self.priority_urls + self.extended_urls + self.directory_urls

        for i, url in enumerate(all_urls, 1):
            try:
                healer_data = self.extract_contact_info(url)
                if healer_data:
                    self.healers_found.append(healer_data)
                    self.logger.info(f"FOUND ({len(self.healers_found)}): {healer_data['name']} - {len(healer_data['emails'])} emails")

                    # Show progress
                    if len(self.healers_found) % 10 == 0:
                        self.logger.info(f"Progress: {len(self.healers_found)} healers found from {i} sites processed")

                    # Stop when we reach target
                    if len(self.healers_found) >= 100:
                        self.logger.info(f"TARGET REACHED: Found 100+ healers!")
                        break

                time.sleep(0.5)  # Fast processing

            except Exception as e:
                continue

        return self.healers_found

    def save_results(self):
        """Save results to CSV"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        os.makedirs(exports_dir, exist_ok=True)

        csv_file = os.path.join(exports_dir, f"priority_healer_contacts_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Name', 'Website', 'Primary_Email', 'All_Emails']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for healer in self.healers_found:
                writer.writerow({
                    'Name': healer['name'],
                    'Website': healer['website'],
                    'Primary_Email': healer['emails'][0] if healer['emails'] else '',
                    'All_Emails': '; '.join(healer['emails'])
                })

        return os.path.basename(csv_file)

def main():
    extractor = PriorityHealerExtractor()
    healers = extractor.run_priority_extraction()

    if healers:
        csv_file = extractor.save_results()
        total_emails = sum(len(h['emails']) for h in healers)

        print(f"\nPRIORITY EXTRACTION COMPLETE:")
        print(f"Healers found: {len(healers)}")
        print(f"Total emails: {total_emails}")
        print(f"File saved: {csv_file}")

        if len(healers) >= 100:
            print("\nSUCCESS: Found 100+ real healers with email addresses!")

        print(f"\nComplete results saved to CSV file.")
    else:
        print("No contact data found.")

if __name__ == "__main__":
    main()