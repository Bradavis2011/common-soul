#!/usr/bin/env python3
"""
STREAMLINED REAL CONTACT EXTRACTOR
Quick extraction of real healer contact data from live websites.
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import csv
import time
from datetime import datetime
import logging

class RealContactExtractor:
    def __init__(self):
        self.healers_found = []
        self.session = requests.Session()

        # Set up session headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        # Real healer websites found through comprehensive web search
        self.working_sites = [
            # Existing verified working sites
            'https://www.reikiinfinitehealer.com',
            'https://reikihealingarts.com',
            'https://healingwithjules.com',
            'https://www.spiritofhealing.org',
            # Reiki & Energy Healing (2024 search results)
            'https://gentlehandsreiki.com',
            'https://www.peacefulsoulreiki.com',
            'https://shamanicspiritualhealing.com',
            'https://www.michelleshealinghaven.com',
            'https://sarahbrassard.com',
            'https://www.helloenergyhealing.com',
            'https://thealtyr.com',
            'https://energy-one.com',
            # Crystal Healing Practitioners
            'https://webcrystalacademy.com',
            'https://loveandlightschool.com',
            'https://creative-healing.com',
            'https://www.evolvehealing.net',
            # Chakra & Holistic Healers (USA)
            'https://www.lifeforcepractices.com',
            'https://paritashahhealing.com',
            'https://lindadarin.com',
            'https://www.chakrainnerpeace.com',
            'https://www.healingartsnyc.com',
            'https://mychakracenter.com',
            # Sound Healing Practitioners
            'https://www.academyofsoundhealing.com',
            'https://transcendsoundhealing.com',
            'https://healing-sounds.com',
            # Professional Directories
            'https://www.energyhealingconference.com',
            'https://www.soulsearch.io',
            'https://holistichealthlink.com'
        ]

        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def clean_phone_numbers(self, phones):
        """Clean and limit phone numbers to avoid overwhelming results"""
        cleaned = []
        for phone in phones:
            # Remove obvious junk numbers
            digits = re.sub(r'[^\d]', '', phone)
            if len(digits) == 10 or (len(digits) == 11 and digits.startswith('1')):
                # Format nicely
                if len(digits) == 10:
                    formatted = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
                else:
                    formatted = f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"

                # Avoid duplicates and obviously fake numbers
                if (formatted not in cleaned and
                    not any(bad in digits for bad in ['1111111111', '0000000000', '1234567890'])):
                    cleaned.append(formatted)

                    # Limit to 3 phone numbers per site
                    if len(cleaned) >= 3:
                        break

        return cleaned

    def extract_contact_info(self, url):
        """Extract real contact information from a healer website"""
        self.logger.info(f"Extracting from: {url}")

        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return None

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Extract emails
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, content, re.IGNORECASE)

            # Clean emails
            clean_emails = []
            for email in emails:
                email = email.lower()
                if (email not in clean_emails and
                    '@' in email and
                    not any(bad in email for bad in ['noreply', 'example.', 'test@'])):
                    clean_emails.append(email)
                    if len(clean_emails) >= 3:  # Limit to 3 emails
                        break

            # Extract phone numbers
            phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
            phones = re.findall(phone_pattern, content)
            clean_phones = self.clean_phone_numbers(phones)

            # Extract business name from title
            title_tag = soup.find('title')
            if title_tag:
                business_name = title_tag.get_text().strip()
                business_name = re.sub(r'\s*[-|]\s*.+$', '', business_name)
            else:
                business_name = url.split('//')[1].split('/')[0].replace('www.', '')

            if clean_emails or clean_phones:
                return {
                    'name': business_name,
                    'website': url,
                    'emails': clean_emails,
                    'phones': clean_phones,
                    'found_at': datetime.now().isoformat()
                }

        except Exception as e:
            self.logger.error(f"Failed to extract from {url}: {str(e)}")

        return None

    def run_quick_extraction(self):
        """Run quick real data extraction"""
        self.logger.info("Starting quick real contact extraction...")

        for url in self.working_sites:
            try:
                healer_data = self.extract_contact_info(url)
                if healer_data:
                    self.healers_found.append(healer_data)
                    self.logger.info(f"FOUND REAL DATA: {healer_data['name']} - {len(healer_data['emails'])} emails, {len(healer_data['phones'])} phones")

                # Rate limiting
                time.sleep(2)

            except Exception as e:
                self.logger.error(f"Error processing {url}: {str(e)}")
                continue

        return self.healers_found

    def save_results(self):
        """Save extraction results to Discovery Results folder"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Ensure Discovery Results folders exist
        import os
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        databases_dir = os.path.join(results_dir, 'databases')

        os.makedirs(exports_dir, exist_ok=True)
        os.makedirs(databases_dir, exist_ok=True)

        # Save CSV for immediate use
        csv_file = os.path.join(exports_dir, f"real_healer_contacts_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Name', 'Website', 'Primary_Email', 'All_Emails', 'Primary_Phone', 'All_Phones']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for healer in self.healers_found:
                writer.writerow({
                    'Name': healer['name'],
                    'Website': healer['website'],
                    'Primary_Email': healer['emails'][0] if healer['emails'] else '',
                    'All_Emails': '; '.join(healer['emails']),
                    'Primary_Phone': healer['phones'][0] if healer['phones'] else '',
                    'All_Phones': '; '.join(healer['phones'])
                })

        # Save JSON with full data
        json_file = os.path.join(databases_dir, f"real_healer_data_{timestamp}.json")
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({
                'extraction_time': timestamp,
                'total_healers': len(self.healers_found),
                'data_source': 'REAL_LIVE_WEBSITES',
                'healers': self.healers_found
            }, f, indent=2)

        return os.path.basename(csv_file), os.path.basename(json_file)

def main():
    print("REAL CONTACT EXTRACTOR")
    print("Extracting actual contact info from live healer websites...")
    print("=" * 50)

    extractor = RealContactExtractor()

    # Run extraction
    healers = extractor.run_quick_extraction()

    if healers:
        csv_file, json_file = extractor.save_results()

        total_emails = sum(len(h['emails']) for h in healers)
        total_phones = sum(len(h['phones']) for h in healers)

        print(f"\nREAL EXTRACTION RESULTS:")
        print(f"Healers found: {len(healers)}")
        print(f"Total emails: {total_emails}")
        print(f"Total phones: {total_phones}")
        print(f"Files saved: {csv_file}, {json_file}")

        print(f"\nReal healers found:")
        for i, healer in enumerate(healers, 1):
            print(f"{i}. {healer['name']}")
            if healer['emails']:
                print(f"   Email: {healer['emails'][0]}")
            if healer['phones']:
                print(f"   Phone: {healer['phones'][0]}")
            print(f"   Website: {healer['website']}")
            print()
    else:
        print("No real contact data found.")

if __name__ == "__main__":
    main()