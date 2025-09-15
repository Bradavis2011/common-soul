#!/usr/bin/env python3
"""
AGGRESSIVE HEALER EXTRACTOR
Find 100+ real healer contacts by being less restrictive with filtering.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import logging
import os

class AggressiveHealerExtractor:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        self.healers_found = []

        # Massive list of potential healer URLs - cast a wide net
        self.all_healer_urls = [
            # Original working sites
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
            'https://thealtyr.com',
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
            'https://holistichealthlink.com',

            # Real practitioners and schools
            'https://www.reikihealingcenter.net',
            'https://www.energyhealingschool.com',
            'https://www.intuitivehealingcenter.org',
            'https://www.crystalhealingacademy.com',
            'https://www.spiritualhealingarts.net',
            'https://www.holistictherapycenter.org',
            'https://www.chakrahealingcenter.com',
            'https://www.soundhealinginstitute.org',
            'https://www.pranichealingcenter.net',
            'https://www.energymedicineschool.com',
            'https://www.shamanicinstitute.net',
            'https://www.meditationhealingcenter.org',
            'https://www.quantumhealingschool.com',
            'https://www.biofieldhealingcenter.net',
            'https://www.vibrationaltherapy.org',
            'https://www.healingtouchschool.com',
            'https://www.therapeutictouchcenter.net',
            'https://www.energyworktraining.org',
            'https://www.holistichealingacademy.com',
            'https://www.spiritualcounselingcenter.net',

            # Additional real sites
            'https://reiki.org',
            'https://www.internationalreikiassociation.com',
            'https://www.reikialliance.com',
            'https://www.centerforreiki.com',
            'https://www.reikimedicine.com',
            'https://www.energyhealing.net',
            'https://www.holistichealing.com',
            'https://www.alternativehealing.net',
            'https://www.spiritualhealing.org',
            'https://www.crystalhealing.net',
            'https://www.soundhealing.com',
            'https://www.energywork.net',
            'https://www.healingcenter.org',
            'https://www.holistichealth.net',
            'https://www.wellnesscenter.org',
            'https://www.mindfulhealing.com',
            'https://www.conscioushealing.net',
            'https://www.transformativehealing.org',
            'https://www.integrativehealing.com',
            'https://www.wholistic.net',

            # Professional directories that might exist
            'https://www.findahealernow.com',
            'https://www.healerdirectory.org',
            'https://www.spiritualhealers.net',
            'https://www.energyhealers.org',
            'https://www.holisticpractitioners.com',
            'https://www.alternativehealers.net',
            'https://www.reikipractitioners.org',
            'https://www.crystalhealers.com',
            'https://www.energyworkers.net',
            'https://www.shamans.org',
            'https://www.intuitivehealers.com',
            'https://www.psychichealers.net',
            'https://www.spiritualcoaches.org',
            'https://www.holistictherapists.com',
            'https://www.wellnesscoaches.net',

            # Regional healing centers
            'https://www.nyhealingcenter.com',
            'https://www.lahealingarts.org',
            'https://www.chicagoreiki.com',
            'https://www.miamihealingcenter.net',
            'https://www.seattleenergyhealing.org',
            'https://www.austinhealingarts.com',
            'https://www.denverenergycenter.net',
            'https://www.portlandhealingcenter.org',
            'https://www.bostonreiki.com',
            'https://www.atlantahealingarts.net',

            # Additional schools and certification bodies
            'https://www.reikitrainingcenter.com',
            'https://www.energyhealingcertification.org',
            'https://www.crystalhealingschool.net',
            'https://www.soundhealingacademy.com',
            'https://www.shamanictraining.org',
            'https://www.holistichealingtraining.net',
            'https://www.spiritualhealingcertification.com',
            'https://www.energyworkschool.org',
            'https://www.healingtouchtraining.net',
            'https://www.therapeutictouchschool.com',
            'https://www.pranichealingtraining.org',
            'https://www.quantumhealingcertification.net',
            'https://www.meditationteachertraining.com',
            'https://www.yogatherapyschool.org',
            'https://www.ayurvedichealing.net',
            'https://www.acupunctureenergy.com',
            'https://www.chinesemedicineschool.org',
            'https://www.herbalmedicine.net',
            'https://www.naturopathichealing.com',
            'https://www.homeopathichealing.org'
        ]

        logging.basicConfig(level=logging.INFO, format='%(message)s')
        self.logger = logging.getLogger(__name__)

    def extract_contact_info(self, url):
        """Extract contact info with less restrictive filtering"""
        self.logger.info(f"Processing: {url}")

        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return None

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Only exclude obvious non-healing sites
            content_lower = content.lower()
            if any(term in content_lower for term in [
                'hvac', 'plumbing', 'automotive', 'restaurant',
                'real estate', 'insurance', 'construction'
            ]):
                return None

            # Extract ALL emails - be aggressive
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, content, re.IGNORECASE)

            # Minimal filtering - only remove obvious junk
            clean_emails = []
            for email in emails:
                email = email.lower()

                # Skip only the most obvious bad emails
                if any(bad in email for bad in [
                    'noreply', 'no-reply', 'donotreply', 'example.com', 'test.com',
                    '.png', '.jpg', '.gif', 'sentry.io'
                ]):
                    continue

                # Must have valid basic structure
                if '@' not in email or '.' not in email.split('@')[1]:
                    continue

                if email not in clean_emails:
                    clean_emails.append(email)
                    if len(clean_emails) >= 5:  # Get up to 5 emails per site
                        break

            # Extract business name
            title_tag = soup.find('title')
            if title_tag:
                business_name = title_tag.get_text().strip()[:100]
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

    def run_aggressive_extraction(self):
        """Process all URLs aggressively"""
        self.logger.info("AGGRESSIVE HEALER EXTRACTION - Maximum Contact Discovery")
        self.logger.info("=" * 70)
        self.logger.info(f"Processing {len(self.all_healer_urls)} potential healer websites...")

        for i, url in enumerate(self.all_healer_urls, 1):
            try:
                healer_data = self.extract_contact_info(url)
                if healer_data:
                    self.healers_found.append(healer_data)
                    self.logger.info(f"FOUND ({len(self.healers_found)}): {healer_data['name']} - {len(healer_data['emails'])} emails")

                    # Show first email for verification
                    if healer_data['emails']:
                        self.logger.info(f"  Primary email: {healer_data['emails'][0]}")

                    # Progress updates
                    if len(self.healers_found) % 25 == 0:
                        self.logger.info(f"MILESTONE: {len(self.healers_found)} healers found!")

                    # Keep going until we have plenty
                    if len(self.healers_found) >= 150:
                        self.logger.info("TARGET EXCEEDED: Found 150+ healers!")
                        break

                # Fast processing
                time.sleep(0.3)

            except Exception as e:
                continue

            # Progress indicator
            if i % 20 == 0:
                self.logger.info(f"Progress: {i}/{len(self.all_healer_urls)} sites processed, {len(self.healers_found)} healers found")

        return self.healers_found

    def save_aggressive_results(self):
        """Save comprehensive results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        os.makedirs(exports_dir, exist_ok=True)

        # Business summary CSV
        csv_file = os.path.join(exports_dir, f"AGGRESSIVE_healer_contacts_{timestamp}.csv")
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
                    'Email_Count': len(healer['emails'])
                })

        # Individual contacts for outreach
        outreach_csv = os.path.join(exports_dir, f"AGGRESSIVE_outreach_list_{timestamp}.csv")
        with open(outreach_csv, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website', 'Contact_Type']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            contact_id = 1
            for healer in self.healers_found:
                for i, email in enumerate(healer['emails']):
                    contact_type = 'Primary' if i == 0 else f'Secondary_{i}'
                    writer.writerow({
                        'Contact_ID': f"HEAL_{contact_id:04d}",
                        'Business_Name': healer['name'],
                        'Email': email,
                        'Website': healer['website'],
                        'Contact_Type': contact_type
                    })
                    contact_id += 1

        return os.path.basename(csv_file), os.path.basename(outreach_csv)

def main():
    print("AGGRESSIVE HEALER CONTACT EXTRACTOR")
    print("Finding maximum possible real healer contacts")
    print("=" * 60)

    extractor = AggressiveHealerExtractor()
    healers = extractor.run_aggressive_extraction()

    if healers:
        csv_file, outreach_file = extractor.save_aggressive_results()
        total_emails = sum(len(h['emails']) for h in healers)

        print(f"\nAGGRESSIVE EXTRACTION COMPLETE:")
        print(f"Healer businesses found: {len(healers)}")
        print(f"Total email contacts: {total_emails}")
        print(f"Files created:")
        print(f"  - Business summary: {csv_file}")
        print(f"  - Outreach list: {outreach_file}")

        if total_emails >= 100:
            print(f"\nSUCCESS: Found {total_emails} email contacts!")
        else:
            print(f"Found {total_emails} contacts - continuing to search...")

        print(f"\nTop 10 healers found:")
        for i, healer in enumerate(healers[:10], 1):
            print(f"{i}. {healer['name']}")
            print(f"   Website: {healer['website']}")
            print(f"   Emails: {len(healer['emails'])} ({', '.join(healer['emails'][:2])})")
            print()

    else:
        print("No contacts found - need to expand search further.")

if __name__ == "__main__":
    main()