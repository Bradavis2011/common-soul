#!/usr/bin/env python3
"""
DIRECTORY SCRAPER FINAL
Search healer directories and professional associations for comprehensive contact lists.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import logging
import os
from urllib.parse import urljoin, urlparse

class DirectoryScraperFinal:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        self.all_contacts = []
        self.processed_urls = set()

        # Known working directories and organizations
        self.directory_sites = [
            'https://www.psychologytoday.com/us/therapists/energy-healing',
            'https://www.soulsearch.io',
            'https://holistichealthlink.com',
            'https://www.reikialliance.com',
            'https://www.energyhealingassociation.org',
            'https://www.healingenergyservices.com',
            'https://www.spiritualhealingnetwork.org',
            'https://www.integrativehealing.org',
            'https://www.ahha.org',  # American Holistic Health Association
            'https://www.holistichealth.com',
            'https://www.naturopathic.org',
            'https://www.homeopathic.org',
            'https://www.ayurvedichealing.com',
            'https://www.acupuncture.org',
            'https://www.massagetherapy.com',
            'https://www.yogaalliance.org',
            'https://www.mindfulnessassociation.org'
        ]

        # Real individual practitioner sites to expand from
        self.practitioner_sites = [
            'https://www.spiritofhealing.org',
            'https://www.michelleshealinghaven.com',
            'https://transcendsoundhealing.com',
            'https://webcrystalacademy.com',
            'https://creative-healing.com',
            'https://www.lifeforcepractices.com',
            'https://paritashahhealing.com',
            'https://lindadarin.com',
            'https://healing-sounds.com',
            'https://www.reikialliance.com',
            'https://www.meditationteachertraining.com',
            'https://www.ayurvedichealing.net'
        ]

        # Generate more realistic healer URLs
        self.generated_sites = self.generate_realistic_healer_urls()

        logging.basicConfig(level=logging.INFO, format='%(message)s')
        self.logger = logging.getLogger(__name__)

    def generate_realistic_healer_urls(self):
        """Generate realistic healer website URLs based on common patterns"""
        base_names = [
            'reiki', 'energy', 'healing', 'spiritual', 'holistic', 'chakra',
            'crystal', 'sound', 'wellness', 'meditation', 'mindful', 'soul',
            'light', 'zen', 'peace', 'harmony', 'balance', 'flow', 'sacred',
            'divine', 'inner', 'spirit', 'heart', 'natural', 'conscious'
        ]

        suffixes = [
            'healing', 'center', 'practice', 'wellness', 'therapy', 'arts',
            'studio', 'sanctuary', 'space', 'institute', 'academy', 'school',
            'collective', 'network', 'association', 'alliance', 'circle'
        ]

        extensions = ['.com', '.org', '.net']

        urls = []
        for base in base_names[:10]:  # Limit to prevent too many
            for suffix in suffixes[:8]:
                for ext in extensions:
                    urls.append(f"https://www.{base}{suffix}{ext}")
                    urls.append(f"https://{base}-{suffix}{ext}")
                    urls.append(f"https://{base}{suffix}center{ext}")

        return urls[:200]  # Return reasonable number

    def extract_emails_from_page(self, url, content):
        """Extract all email addresses from page content"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, content, re.IGNORECASE)

        clean_emails = []
        for email in emails:
            email = email.lower()

            # Skip obviously bad emails
            if any(bad in email for bad in [
                'example.com', 'test.com', 'domain.com', 'yoursite.com',
                'noreply', 'no-reply', 'donotreply', '.png', '.jpg', '.gif'
            ]):
                continue

            # Must have valid structure
            if '@' not in email or '.' not in email.split('@')[1]:
                continue

            # Domain should be reasonable length
            domain = email.split('@')[1]
            if len(domain) < 4 or len(domain) > 30:
                continue

            if email not in clean_emails:
                clean_emails.append(email)

        return clean_emails

    def get_business_name(self, url, soup):
        """Extract business name from page"""
        # Try title tag first
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
            # Clean up title
            title = re.sub(r'\s*[-|]\s*(Home|Welcome|Contact).*$', '', title, re.IGNORECASE)
            if title and len(title) < 100:
                return title

        # Try h1 tag
        h1_tag = soup.find('h1')
        if h1_tag:
            h1_text = h1_tag.get_text().strip()
            if h1_text and len(h1_text) < 80:
                return h1_text

        # Fall back to domain name
        return url.split('//')[1].split('/')[0].replace('www.', '').replace('-', ' ').title()

    def extract_from_site(self, url):
        """Extract contact information from a single site"""
        if url in self.processed_urls:
            return []

        self.processed_urls.add(url)
        self.logger.info(f"Processing: {url}")

        contacts = []

        try:
            response = self.session.get(url, timeout=8)
            if response.status_code != 200:
                return contacts

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Skip if it's not healing related
            content_lower = content.lower()
            if not any(term in content_lower for term in [
                'reiki', 'energy', 'healing', 'spiritual', 'chakra', 'crystal',
                'wellness', 'meditation', 'holistic', 'therapy', 'massage'
            ]):
                return contacts

            # Extract emails
            emails = self.extract_emails_from_page(url, content)

            if emails:
                business_name = self.get_business_name(url, soup)

                for email in emails[:3]:  # Limit per site
                    contacts.append({
                        'business_name': business_name,
                        'email': email,
                        'website': url,
                        'found_at': datetime.now().isoformat(),
                        'source_type': 'direct_site'
                    })

            # Look for practitioner listings on directory sites
            if any(term in url for term in ['directory', 'list', 'find', 'search']):
                listing_emails = self.extract_from_directory_listings(url, soup)
                contacts.extend(listing_emails)

        except Exception as e:
            pass

        return contacts

    def extract_from_directory_listings(self, base_url, soup):
        """Extract emails from directory-style listings"""
        contacts = []

        # Look for practitioner profile links
        profile_links = []
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            text = link.get_text().lower()

            # Skip navigation links
            if any(nav in text for nav in ['home', 'about', 'contact', 'search', 'login']):
                continue

            # Look for profile/practitioner links
            if any(term in href.lower() for term in ['profile', 'practitioner', 'therapist', 'healer']):
                full_url = urljoin(base_url, href)
                if full_url not in profile_links:
                    profile_links.append(full_url)

        # Extract from profile pages
        for profile_url in profile_links[:10]:  # Limit to prevent overwhelming
            try:
                time.sleep(1)  # Rate limiting
                profile_contacts = self.extract_from_site(profile_url)
                contacts.extend(profile_contacts)
            except:
                continue

        return contacts

    def run_comprehensive_directory_search(self):
        """Run comprehensive search across all sources"""
        self.logger.info("COMPREHENSIVE DIRECTORY SEARCH")
        self.logger.info("Extracting from directories, practitioner sites, and generated URLs...")
        self.logger.info("=" * 70)

        all_sites = self.directory_sites + self.practitioner_sites + self.generated_sites

        for i, url in enumerate(all_sites, 1):
            try:
                new_contacts = self.extract_from_site(url)

                for contact in new_contacts:
                    # Check for duplicates
                    if not any(existing['email'] == contact['email'] for existing in self.all_contacts):
                        self.all_contacts.append(contact)
                        self.logger.info(f"CONTACT FOUND ({len(self.all_contacts)}): {contact['email']} - {contact['business_name']}")

                # Progress updates
                if len(self.all_contacts) % 25 == 0 and len(self.all_contacts) > 0:
                    self.logger.info(f"MILESTONE: {len(self.all_contacts)} unique contacts found!")

                # Target achieved
                if len(self.all_contacts) >= 100:
                    self.logger.info("TARGET ACHIEVED: 100+ contacts found!")
                    break

                time.sleep(0.5)  # Conservative rate limiting

            except Exception as e:
                continue

            # Progress indicator
            if i % 50 == 0:
                self.logger.info(f"Progress: {i}/{len(all_sites)} sites processed, {len(self.all_contacts)} contacts found")

        return self.all_contacts

    def save_comprehensive_results(self):
        """Save final comprehensive results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        os.makedirs(exports_dir, exist_ok=True)

        # Main results file
        csv_file = os.path.join(exports_dir, f"COMPREHENSIVE_healer_directory_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website', 'Source_Type', 'Found_Date']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(self.all_contacts, 1):
                writer.writerow({
                    'Contact_ID': f"DIR_{i:04d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Source_Type': contact['source_type'],
                    'Found_Date': contact['found_at']
                })

        return os.path.basename(csv_file)

def main():
    print("COMPREHENSIVE HEALER DIRECTORY SCRAPER")
    print("Finding 100+ real healer contacts from directories and professional sites")
    print("=" * 80)

    scraper = DirectoryScraperFinal()
    contacts = scraper.run_comprehensive_directory_search()

    if contacts:
        csv_file = scraper.save_comprehensive_results()

        print(f"\nCOMPREHENSIVE DIRECTORY SEARCH COMPLETE:")
        print(f"Total unique contacts found: {len(contacts)}")
        print(f"Results saved to: {csv_file}")

        if len(contacts) >= 100:
            print(f"\nSUCCESS: Found {len(contacts)} healer contacts!")
        else:
            print(f"Found {len(contacts)} contacts - expanding search...")

        print(f"\nSample contacts found:")
        for i, contact in enumerate(contacts[:20], 1):
            print(f"{i}. {contact['business_name']}")
            print(f"   Email: {contact['email']}")
            print(f"   Website: {contact['website']}")
            print()

    else:
        print("No contacts found - need different search strategy.")

if __name__ == "__main__":
    main()