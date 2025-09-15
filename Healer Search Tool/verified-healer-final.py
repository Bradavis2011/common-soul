#!/usr/bin/env python3
"""
VERIFIED HEALER FINAL EXTRACTOR
Extract clean, real email contacts from verified working healer websites only.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import logging
import os

class VerifiedHealerExtractor:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        self.healers_found = []

        # ONLY verified working healer websites - no fake URLs
        self.verified_sites = [
            'https://www.michelleshealinghaven.com',
            'https://transcendsoundhealing.com',
            'https://www.spiritofhealing.org',
            'https://webcrystalacademy.com',
            'https://creative-healing.com',
            'https://www.lifeforcepractices.com',
            'https://paritashahhealing.com',
            'https://lindadarin.com',
            'https://healing-sounds.com',
            'https://www.soulsearch.io',
            'https://holistichealthlink.com'
        ]

        logging.basicConfig(level=logging.INFO, format='%(message)s')
        self.logger = logging.getLogger(__name__)

    def extract_all_contacts_from_site(self, url):
        """Extract all possible email contacts from a healer website including subpages"""
        self.logger.info(f"Deep extracting from: {url}")

        all_emails = set()
        pages_to_check = [url]

        try:
            # Get main page
            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                return None

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Check if healing-related
            if not self.is_healing_related_content(content.lower()):
                return None

            # Extract emails from main page
            emails = self.extract_clean_emails(content)
            all_emails.update(emails)

            # Find contact/about pages
            contact_links = []
            for link in soup.find_all('a', href=True):
                href = link.get('href')
                text = link.get_text().lower()

                if any(term in text for term in ['contact', 'about', 'bio', 'team', 'staff']):
                    if href.startswith('/'):
                        full_url = url.rstrip('/') + href
                    elif href.startswith('http'):
                        if url.split('//')[1].split('/')[0] in href:
                            full_url = href
                        else:
                            continue
                    else:
                        continue

                    if full_url not in contact_links:
                        contact_links.append(full_url)

            # Extract from contact pages
            for contact_url in contact_links[:3]:  # Limit to 3 additional pages
                try:
                    time.sleep(1)
                    response = self.session.get(contact_url, timeout=10)
                    if response.status_code == 200:
                        emails = self.extract_clean_emails(response.text)
                        all_emails.update(emails)
                except:
                    continue

            # Get business name
            title_tag = soup.find('title')
            if title_tag:
                business_name = title_tag.get_text().strip()
                business_name = re.sub(r'\s*[-|]\s*.+$', '', business_name)
                business_name = business_name[:80]
            else:
                business_name = url.split('//')[1].split('/')[0].replace('www.', '')

            clean_emails = list(all_emails)
            if clean_emails:
                return {
                    'name': business_name,
                    'website': url,
                    'emails': clean_emails[:3],  # Limit to 3 best emails
                    'found_at': datetime.now().isoformat()
                }

        except Exception as e:
            self.logger.error(f"Failed to extract from {url}: {str(e)}")

        return None

    def extract_clean_emails(self, content):
        """Extract and clean email addresses"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, content, re.IGNORECASE)

        clean_emails = []
        for email in emails:
            email = email.lower()

            # Skip obviously bad emails
            if any(bad in email for bad in [
                'noreply', 'example.', 'test@', 'admin@', 'info@godaddy',
                'support@', 'no-reply', 'donotreply', '@sentry', '@wixpress',
                '@2x.', '.png', '.jpg', '.gif', '@sentry.io', '@wup1rsxzoe',
                'sprite-google-places', 'product_', 'mega_image', 'logo-vertical'
            ]):
                continue

            # Must have valid domain
            if '@' not in email or '.' not in email.split('@')[1]:
                continue

            # Domain must be reasonable length
            domain = email.split('@')[1]
            if len(domain) < 4 or len(domain) > 50:
                continue

            clean_emails.append(email)

        return clean_emails

    def is_healing_related_content(self, content):
        """Check if website content is healing-related"""
        exclude_terms = [
            'heating', 'hvac', 'furnace', 'air conditioning', 'plumbing',
            'electrical', 'utility', 'gas', 'electric company', 'contractor',
            'construction', 'real estate', 'insurance', 'financial',
            'automotive', 'restaurant', 'retail', 'shopping', 'domain for sale'
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

    def run_verified_extraction(self):
        """Extract from verified sites only"""
        self.logger.info("VERIFIED HEALER FINAL EXTRACTION")
        self.logger.info("=" * 50)
        self.logger.info("Processing only verified working healer websites...")

        for url in self.verified_sites:
            try:
                healer_data = self.extract_all_contacts_from_site(url)
                if healer_data:
                    self.healers_found.append(healer_data)
                    self.logger.info(f"VERIFIED: {healer_data['name']} - {len(healer_data['emails'])} emails")
                    for email in healer_data['emails']:
                        self.logger.info(f"  Email: {email}")

                time.sleep(2)  # Rate limiting

            except Exception as e:
                self.logger.error(f"Error processing {url}: {str(e)}")
                continue

        return self.healers_found

    def save_final_results(self):
        """Save final verified results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        os.makedirs(exports_dir, exist_ok=True)

        # Save comprehensive CSV with all found emails
        csv_file = os.path.join(exports_dir, f"FINAL_verified_healer_contacts_{timestamp}.csv")
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

        # Also create individual contact rows for easier mailing
        individual_csv = os.path.join(exports_dir, f"FINAL_individual_contacts_{timestamp}.csv")
        with open(individual_csv, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_Name', 'Business_Name', 'Email', 'Website']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            contact_num = 1
            for healer in self.healers_found:
                for i, email in enumerate(healer['emails']):
                    writer.writerow({
                        'Contact_Name': f"{healer['name']} - Contact {i+1}",
                        'Business_Name': healer['name'],
                        'Email': email,
                        'Website': healer['website']
                    })
                    contact_num += 1

        return os.path.basename(csv_file), os.path.basename(individual_csv)

def main():
    print("FINAL VERIFIED HEALER EXTRACTION")
    print("Extract clean, real contacts from verified sites only")
    print("=" * 60)

    extractor = VerifiedHealerExtractor()
    healers = extractor.run_verified_extraction()

    if healers:
        csv_file, individual_csv = extractor.save_final_results()
        total_emails = sum(len(h['emails']) for h in healers)

        print(f"\nFINAL VERIFIED RESULTS:")
        print(f"Verified healers: {len(healers)}")
        print(f"Total real emails: {total_emails}")
        print(f"Files saved:")
        print(f"  - Business summary: {csv_file}")
        print(f"  - Individual contacts: {individual_csv}")

        print(f"\nVerified healers with real contact info:")
        for i, healer in enumerate(healers, 1):
            print(f"{i}. {healer['name']}")
            print(f"   Website: {healer['website']}")
            for j, email in enumerate(healer['emails'], 1):
                print(f"   Email {j}: {email}")
            print()
    else:
        print("No verified contact data found.")

if __name__ == "__main__":
    main()