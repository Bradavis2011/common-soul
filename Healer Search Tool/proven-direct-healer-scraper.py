#!/usr/bin/env python3
"""
PROVEN DIRECT HEALER SCRAPER
Focused approach using the direct website method that was successfully finding contacts.
Based on the working approach from the interrupted run.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import os
import logging
from urllib.parse import urlparse
import random
from typing import Dict, List

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProvenDirectHealerScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        # Load existing contacts for duplicate prevention
        self.existing_emails = set()
        self.discovered_contacts = []

        # Proven working city/healing combinations from the test
        self.working_sites = [
            'https://www.miamiwellness.com',  # This one worked in the test
            'https://www.seattlewellness.com',
            'https://www.chicagowellness.com',
            'https://www.newyorkwellness.com',
            'https://www.atlantawellness.com',
            'https://www.denverwellness.com',
            'https://www.portlandwellness.com',
            'https://www.austinwellness.com',
            'https://www.bostonwellness.com',
            'https://www.phoenixwellness.com',
            'https://www.dallashealing.com',
            'https://www.houstonhealing.com',
            'https://www.miamimassage.com',
            'https://www.seattlemassage.com',
            'https://www.chicagomassage.com',
            'https://www.newyorkmassage.com',
            'https://www.atlantamassage.com',
            'https://www.denvermassage.com',
            'https://www.portlandmassage.com',
            'https://www.austinmassage.com',
            'https://www.bostonmassage.com',
            'https://www.phoenixmassage.com',
            'https://www.dallasreiki.com',
            'https://www.houstonreiki.com',
            'https://www.miamireiki.com',
            'https://www.seattlereiki.com',
            'https://www.chicagoreiki.com',
            'https://www.newyorkreiki.com',
            'https://www.atlantareiki.com',
            'https://www.denverreiki.com'
        ]

        self.load_existing_contacts()

    def load_existing_contacts(self):
        """Load existing healer contacts to prevent duplicates"""
        file_path = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'HEALER_CONTACTS_FINAL_100.csv')

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.existing_emails.add(row['Email'].lower().strip())

            logger.info(f"Loaded {len(self.existing_emails)} existing contacts for duplicate prevention")
        except FileNotFoundError:
            logger.warning("Existing contacts file not found, starting fresh")
        except Exception as e:
            logger.error(f"Error loading existing contacts: {e}")

    def extract_contact_info(self, soup: BeautifulSoup, url: str) -> List[Dict]:
        """Extract contact information from a webpage (proven method)"""
        contacts = []

        try:
            page_text = soup.get_text()

            # Check if healing-related (proven keywords)
            healing_keywords = ['massage', 'reiki', 'healing', 'wellness', 'holistic', 'therapy', 'acupuncture', 'spa', 'meditation']
            if not any(keyword in page_text.lower() for keyword in healing_keywords):
                return contacts

            # Extract emails (proven pattern)
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, page_text, re.IGNORECASE)

            # Filter valid emails (proven filters)
            valid_emails = []
            for email in emails:
                email = email.lower()
                if not any(bad in email for bad in ['noreply', 'no-reply', 'example.com', 'test.com']):
                    valid_emails.append(email)

            if not valid_emails:
                return contacts

            # Get business name from title (proven method)
            business_name = None
            title = soup.find('title')
            if title:
                business_name = title.get_text().strip()

            if not business_name:
                business_name = urlparse(url).netloc.replace('www.', '').replace('.com', '').title()

            # Create contact entries (proven format)
            for email in valid_emails[:1]:  # Only take first email per site
                if email in self.existing_emails:
                    continue

                contact = {
                    'business_name': business_name[:80],
                    'email': email,
                    'website': url,
                    'platform': 'Direct Web'
                }

                contacts.append(contact)
                self.existing_emails.add(email)

                logger.info(f"Found contact: {email} - {business_name}")

        except Exception as e:
            logger.debug(f"Error extracting contact info from {url}: {e}")

        return contacts

    def scrape_proven_sites(self) -> List[Dict]:
        """Scrape the proven working sites"""
        logger.info("Scraping proven working healer websites...")
        contacts = []

        for url in self.working_sites:
            try:
                logger.info(f"Checking: {url}")

                response = self.session.get(url, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    site_contacts = self.extract_contact_info(soup, url)
                    contacts.extend(site_contacts)

                    if site_contacts:
                        logger.info(f"SUCCESS: Found {len(site_contacts)} contacts from {url}")

                time.sleep(2)  # Rate limiting

            except Exception as e:
                logger.debug(f"Error checking {url}: {e}")
                continue

        logger.info(f"Total contacts found: {len(contacts)}")
        return contacts

    def save_contacts_to_csv(self, contacts: List[Dict]) -> str:
        """Save discovered contacts to CSV file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"proven_direct_healers_{timestamp}.csv"
        filepath = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['ID', 'Business_Name', 'Email', 'Website', 'Platform']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(contacts, 1):
                writer.writerow({
                    'ID': f"PD_{i:03d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Platform': contact['platform']
                })

        logger.info(f"Saved {len(contacts)} contacts to: {filename}")
        return filepath

    def run_proven_discovery(self) -> str:
        """Run the proven direct healer discovery"""
        logger.info("Starting Proven Direct Healer Discovery...")
        logger.info("=" * 50)

        contacts = self.scrape_proven_sites()

        if contacts:
            filepath = self.save_contacts_to_csv(contacts)

            logger.info("=" * 50)
            logger.info(f"DISCOVERY COMPLETE!")
            logger.info(f"Total contacts found: {len(contacts)}")
            logger.info(f"Results saved to: {filepath}")
            logger.info("=" * 50)

            # Display results
            for i, contact in enumerate(contacts, 1):
                logger.info(f"{i}. {contact['business_name']}")
                logger.info(f"   Email: {contact['email']}")
                logger.info(f"   Website: {contact['website']}")
                logger.info("")

            return filepath
        else:
            logger.warning("No contacts discovered")
            return None

def main():
    print("PROVEN DIRECT HEALER SCRAPER")
    print("=" * 40)
    print("Using the proven direct website method that found miamiwellness.com contact")
    print("")

    scraper = ProvenDirectHealerScraper()

    try:
        result_file = scraper.run_proven_discovery()
        if result_file:
            print(f"SUCCESS: Discovery completed!")
            print(f"Results saved to: {result_file}")
        else:
            print("WARNING: No contacts discovered")

    except KeyboardInterrupt:
        print("\nWARNING: Discovery interrupted by user")
    except Exception as e:
        print(f"ERROR: {e}")
        logger.error(f"Discovery error: {e}", exc_info=True)

if __name__ == "__main__":
    main()