#!/usr/bin/env python3
"""
REACH 100 CONTACTS - DUPLICATE-FREE SEARCH
Build on existing 49 contacts to reach 100 with NO DUPLICATES.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import logging
import os
import json
from urllib.parse import urljoin, urlparse
import glob

class ReachHundredContacts:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        # Load existing contacts to avoid duplicates
        self.existing_emails = set()
        self.existing_websites = set()
        self.new_contacts = []

        self.load_existing_contacts()

        logging.basicConfig(level=logging.INFO, format='%(message)s')
        self.logger = logging.getLogger(__name__)

    def load_existing_contacts(self):
        """Load all existing contacts to prevent duplicates"""
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
        csv_files = glob.glob(os.path.join(results_dir, '*.csv'))

        for csv_file in csv_files:
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Get email from various column names
                        email = (row.get('Email') or
                                row.get('Primary_Email') or
                                row.get('email', '')).strip().lower()

                        # Get website from various column names
                        website = (row.get('Website') or
                                  row.get('website', '')).strip().lower()

                        if email and '@' in email:
                            self.existing_emails.add(email)
                        if website and 'http' in website:
                            self.existing_websites.add(website)
            except:
                continue

        self.logger.info(f"Loaded {len(self.existing_emails)} existing emails to avoid duplicates")
        self.logger.info(f"Loaded {len(self.existing_websites)} existing websites to avoid duplicates")

    def generate_new_healer_urls(self):
        """Generate new healer URLs not in existing list"""
        # Real healer website patterns
        base_terms = [
            'soul', 'spirit', 'divine', 'sacred', 'inner', 'light', 'zen',
            'harmony', 'peace', 'flow', 'natural', 'pure', 'radiant',
            'awakened', 'conscious', 'mindful', 'gentle', 'wise', 'heart',
            'earth', 'moon', 'sun', 'star', 'cosmic', 'quantum', 'mystic'
        ]

        healing_terms = [
            'reiki', 'energy', 'healing', 'wellness', 'therapy', 'chakra',
            'crystal', 'sound', 'vibration', 'meditation', 'yoga', 'massage',
            'acupuncture', 'aromatherapy', 'hypnotherapy', 'nutrition'
        ]

        suffixes = [
            'center', 'clinic', 'practice', 'studio', 'sanctuary', 'space',
            'institute', 'academy', 'school', 'collective', 'circle', 'path'
        ]

        urls = []

        # Generate combinations
        for base in base_terms:
            for healing in healing_terms:
                for suffix in suffixes[:6]:  # Limit combinations
                    for ext in ['.com', '.org']:
                        url = f"https://www.{base}{healing}{suffix}{ext}"
                        if url.lower() not in self.existing_websites:
                            urls.append(url)

                        url = f"https://{base}-{healing}-{suffix}{ext}"
                        if url.lower() not in self.existing_websites:
                            urls.append(url)

                        # Stop when we have enough new URLs
                        if len(urls) >= 500:
                            return urls

        return urls

    def search_professional_directories(self):
        """Search professional healing directories for more contacts"""
        directory_urls = [
            'https://www.psychologytoday.com/us/therapists/reiki',
            'https://www.psychologytoday.com/us/therapists/holistic',
            'https://www.psychologytoday.com/us/therapists/spiritual',
            'https://www.wellness.com/find/holistic-practitioner',
            'https://www.healthgrades.com/providers/alternative-medicine',
            'https://www.vitals.com/providers/alternative-medicine',
            'https://www.zocdoc.com/alternative-medicine-doctors',
            'https://www.findahealthprovider.com/holistic-practitioners',
            'https://www.holisticmedicine.org/find-practitioner',
            'https://www.ahha.org/find-practitioner',
            'https://directory.nationalwellness.org',
            'https://www.massagetherapy.com/find-massage-therapist',
            'https://www.yogaalliance.org/TeacherPublicProfile',
            'https://www.iayt.org/page/FindYogaTherapist'
        ]

        new_contacts = []

        for directory_url in directory_urls:
            try:
                self.logger.info(f"Searching directory: {directory_url}")
                contacts = self.extract_from_directory(directory_url)
                new_contacts.extend(contacts)

                if len(self.new_contacts) >= 100:
                    break

                time.sleep(2)  # Rate limiting

            except Exception as e:
                continue

        return new_contacts

    def extract_from_directory(self, url):
        """Extract contacts from directory pages"""
        contacts = []

        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return contacts

            soup = BeautifulSoup(response.text, 'html.parser')

            # Look for profile links
            profile_links = []
            for link in soup.find_all('a', href=True):
                href = link.get('href')

                if any(term in href.lower() for term in ['profile', 'provider', 'practitioner', 'therapist']):
                    full_url = urljoin(url, href)
                    if full_url not in profile_links:
                        profile_links.append(full_url)

            # Extract from profiles
            for profile_url in profile_links[:20]:  # Limit per directory
                try:
                    time.sleep(1)
                    profile_contacts = self.extract_contact_from_profile(profile_url)
                    contacts.extend(profile_contacts)
                except:
                    continue

        except Exception as e:
            pass

        return contacts

    def extract_contact_from_profile(self, url):
        """Extract contact info from practitioner profiles"""
        contacts = []

        try:
            response = self.session.get(url, timeout=8)
            if response.status_code != 200:
                return contacts

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Extract emails
            emails = self.extract_clean_emails(content)

            # Get practitioner name and business info
            name = self.extract_practitioner_name(soup)

            for email in emails:
                if email.lower() not in self.existing_emails:
                    contacts.append({
                        'business_name': name,
                        'email': email,
                        'website': url,
                        'source': 'directory_profile'
                    })
                    self.existing_emails.add(email.lower())

        except Exception as e:
            pass

        return contacts

    def extract_clean_emails(self, content):
        """Extract clean email addresses"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, content, re.IGNORECASE)

        clean_emails = []
        for email in emails:
            email = email.lower()

            # Skip bad emails
            if any(bad in email for bad in [
                'noreply', 'no-reply', 'example.com', 'test.com', '.png', '.jpg',
                'sentry.io', 'godaddy.com', 'wixpress.com', 'domain.com'
            ]):
                continue

            # Basic validation
            if '@' in email and '.' in email.split('@')[1]:
                domain = email.split('@')[1]
                if 4 <= len(domain) <= 30:
                    clean_emails.append(email)

        return clean_emails

    def extract_practitioner_name(self, soup):
        """Extract practitioner/business name from profile"""
        # Try different methods to get name
        name_selectors = [
            'h1', '.name', '.practitioner-name', '.provider-name',
            '.business-name', '.title', '[itemprop="name"]'
        ]

        for selector in name_selectors:
            element = soup.select_one(selector)
            if element:
                name = element.get_text().strip()
                if name and len(name) < 100:
                    return name

        # Try title tag
        title = soup.find('title')
        if title:
            name = title.get_text().strip()
            if name and len(name) < 100:
                return name[:80]

        return "Healing Practitioner"

    def search_individual_healer_sites(self):
        """Search new individual healer websites"""
        new_urls = self.generate_new_healer_urls()

        self.logger.info(f"Generated {len(new_urls)} new URLs to search")

        for i, url in enumerate(new_urls):
            if len(self.new_contacts) >= 100:
                break

            try:
                contacts = self.extract_from_healer_site(url)
                self.new_contacts.extend(contacts)

                if len(self.new_contacts) % 10 == 0 and len(self.new_contacts) > 0:
                    self.logger.info(f"Found {len(self.new_contacts)} new contacts so far...")

                time.sleep(0.5)  # Fast processing

            except Exception as e:
                continue

            if i % 100 == 0:
                self.logger.info(f"Progress: {i}/{len(new_urls)} URLs processed")

        return self.new_contacts

    def extract_from_healer_site(self, url):
        """Extract contacts from individual healer website"""
        contacts = []

        if url.lower() in self.existing_websites:
            return contacts

        try:
            response = self.session.get(url, timeout=8)
            if response.status_code != 200:
                return contacts

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Check if healing-related
            content_lower = content.lower()
            if not any(term in content_lower for term in [
                'reiki', 'healing', 'energy', 'spiritual', 'wellness',
                'chakra', 'meditation', 'therapy', 'holistic'
            ]):
                return contacts

            # Extract emails
            emails = self.extract_clean_emails(content)

            # Get business name
            business_name = self.get_business_name(url, soup)

            for email in emails:
                if email.lower() not in self.existing_emails:
                    contacts.append({
                        'business_name': business_name,
                        'email': email,
                        'website': url,
                        'source': 'individual_site'
                    })
                    self.existing_emails.add(email.lower())

                    self.logger.info(f"NEW CONTACT ({len(self.new_contacts) + len(contacts)}): {email} - {business_name}")

        except Exception as e:
            pass

        self.existing_websites.add(url.lower())
        return contacts

    def get_business_name(self, url, soup):
        """Extract business name from website"""
        title = soup.find('title')
        if title:
            name = title.get_text().strip()
            name = re.sub(r'\s*[-|]\s*(Home|Welcome|Contact).*$', '', name, flags=re.IGNORECASE)
            if name and len(name) < 80:
                return name

        # Fall back to domain
        domain = url.split('//')[1].split('/')[0].replace('www.', '')
        return domain.replace('-', ' ').title()

    def run_reach_hundred_search(self):
        """Main search to reach 100 unique contacts"""
        target = 100
        current_total = len(self.existing_emails)
        needed = max(0, target - current_total)

        self.logger.info("REACH 100 CONTACTS - DUPLICATE-FREE SEARCH")
        self.logger.info("=" * 60)
        self.logger.info(f"Current contacts: {current_total}")
        self.logger.info(f"Target contacts: {target}")
        self.logger.info(f"New contacts needed: {needed}")
        self.logger.info("")

        if needed <= 0:
            self.logger.info("Target already reached!")
            return []

        # Search strategies
        self.logger.info("Strategy 1: Professional directories...")
        directory_contacts = self.search_professional_directories()
        self.new_contacts.extend(directory_contacts)

        if len(self.new_contacts) < needed:
            self.logger.info(f"Strategy 2: Individual healer websites... (need {needed - len(self.new_contacts)} more)")
            site_contacts = self.search_individual_healer_sites()

        return self.new_contacts

    def save_hundred_results(self):
        """Save results to reach 100 contacts"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        os.makedirs(exports_dir, exist_ok=True)

        # Save new contacts found
        new_csv = os.path.join(exports_dir, f"NEW_contacts_to_reach_100_{timestamp}.csv")
        with open(new_csv, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website', 'Source']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(self.new_contacts, 1):
                writer.writerow({
                    'Contact_ID': f"NEW_{i:04d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Source': contact['source']
                })

        return os.path.basename(new_csv)

def main():
    print("REACH 100 HEALER CONTACTS - NO DUPLICATES")
    print("Building on existing 49 to reach 100 unique contacts")
    print("=" * 65)

    searcher = ReachHundredContacts()
    new_contacts = searcher.run_reach_hundred_search()

    total_contacts = len(searcher.existing_emails) + len(new_contacts)

    print(f"\nSEARCH COMPLETE:")
    print(f"Previous contacts: {len(searcher.existing_emails)}")
    print(f"New contacts found: {len(new_contacts)}")
    print(f"Total unique contacts: {total_contacts}")

    if new_contacts:
        csv_file = searcher.save_hundred_results()
        print(f"New contacts saved to: {csv_file}")

        print(f"\nNew contacts found:")
        for i, contact in enumerate(new_contacts[:20], 1):
            print(f"{i}. {contact['business_name']}")
            print(f"   Email: {contact['email']}")
            print(f"   Source: {contact['source']}")
            print()

    if total_contacts >= 100:
        print(f"✅ SUCCESS: Reached {total_contacts} unique healer contacts!")
    else:
        print(f"⚠️  Found {total_contacts} contacts - need {100 - total_contacts} more")

if __name__ == "__main__":
    main()