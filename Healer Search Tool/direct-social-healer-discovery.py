#!/usr/bin/env python3
"""
DIRECT SOCIAL HEALER DISCOVERY TOOL
Alternative approach that directly searches healing directories, professional sites,
and known healer platforms without relying on Google search.

Features:
- Direct website crawling for healer directories
- Professional healing platform scraping
- Social media profile discovery through direct methods
- No Google search dependency (avoids rate limits)
- Integration with existing contact database
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
import json
from datetime import datetime
import os
import logging
from urllib.parse import urljoin, urlparse, quote_plus
import random
from typing import Dict, List, Set, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DirectSocialHealerDiscovery:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        # Load existing contacts for duplicate prevention
        self.existing_emails = set()
        self.existing_names = set()
        self.discovered_contacts = []

        # Professional healing directories and platforms to scrape directly
        self.healing_directories = [
            {
                'name': 'Wellness.com',
                'base_url': 'https://www.wellness.com',
                'search_paths': ['/find/massage-therapist', '/find/acupuncturist', '/find/reiki-practitioner', '/find/holistic-healer']
            },
            {
                'name': 'PsychologyToday',
                'base_url': 'https://www.psychologytoday.com',
                'search_paths': ['/us/therapists', '/us/therapists/holistic', '/us/therapists/wellness-coaching']
            },
            {
                'name': 'Thumbtack',
                'base_url': 'https://www.thumbtack.com',
                'search_paths': ['/services/massage-therapy', '/services/reiki-healing', '/services/acupuncture']
            }
        ]

        # Direct healer website patterns to try
        self.healer_website_patterns = [
            # City + Healing combinations
            'https://www.{city}healing.com',
            'https://www.{city}wellness.com',
            'https://www.{city}massage.com',
            'https://www.{city}reiki.com',
            'https://{city}healing.org',
            'https://{city}wellness.net',
            # General healing site patterns
            'https://www.holistichealingcenter.com',
            'https://www.energyhealingcenter.org',
            'https://www.chakrahealingcenter.net',
            'https://www.crystalhealingcenter.com',
            'https://www.soundhealingcenter.org',
            'https://www.integratihealingarts.com',
            'https://www.wellnesscentral.net',
            'https://www.healingart.org',
            'https://www.reikicenter.com',
            'https://www.massagetherapycenter.net',
        ]

        # Major US cities to combine with healing patterns
        self.major_cities = [
            'newyork', 'losangeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
            'sanantonio', 'sandiego', 'dallas', 'sanjose', 'austin', 'jacksonville',
            'fortworth', 'columbus', 'charlotte', 'sanfrancisco', 'indianapolis',
            'seattle', 'denver', 'boston', 'miami', 'atlanta', 'portland', 'vegas'
        ]

        # Social media direct search URLs (alternative to Google)
        self.social_platforms = {
            'linkedin': {
                'company_urls': [
                    'https://www.linkedin.com/company/healing-arts-center',
                    'https://www.linkedin.com/company/wellness-center',
                    'https://www.linkedin.com/company/holistic-healing',
                    'https://www.linkedin.com/company/massage-therapy'
                ],
                'search_base': 'https://www.linkedin.com/search/results/people/'
            },
            'facebook': {
                'page_patterns': [
                    'https://www.facebook.com/{name}healing',
                    'https://www.facebook.com/{name}wellness',
                    'https://www.facebook.com/{name}massage',
                    'https://www.facebook.com/{name}reiki'
                ]
            }
        }

        self.load_existing_contacts()

    def load_existing_contacts(self):
        """Load existing healer contacts to prevent duplicates"""
        file_path = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'HEALER_CONTACTS_FINAL_100.csv')

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    email = row['Email'].lower().strip()
                    name = row['Business_Name'].lower().strip()

                    self.existing_emails.add(email)
                    self.existing_names.add(name)

            logger.info(f"Loaded {len(self.existing_emails)} existing contacts for duplicate prevention")
        except FileNotFoundError:
            logger.warning("Existing contacts file not found, starting fresh")
        except Exception as e:
            logger.error(f"Error loading existing contacts: {e}")

    def is_healing_related(self, text: str) -> bool:
        """Check if content is healing/wellness related"""
        healing_keywords = [
            'massage', 'reiki', 'healing', 'wellness', 'holistic', 'therapy',
            'acupuncture', 'naturopathic', 'energy', 'spiritual', 'meditation',
            'yoga', 'ayurveda', 'aromatherapy', 'reflexology', 'herbalist',
            'chakra', 'crystal', 'sound healing', 'life coach', 'wellness coach'
        ]

        text_lower = text.lower()
        return any(keyword in text_lower for keyword in healing_keywords)

    def extract_contact_info(self, soup: BeautifulSoup, url: str) -> List[Dict]:
        """Extract contact information from a webpage"""
        contacts = []

        try:
            # Get all text content
            page_text = soup.get_text()

            # Check if healing-related
            if not self.is_healing_related(page_text):
                return contacts

            # Extract emails
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, page_text, re.IGNORECASE)

            # Filter valid emails
            valid_emails = []
            for email in emails:
                email = email.lower()
                if not any(bad in email for bad in [
                    'noreply', 'no-reply', 'donotreply', 'example.com', 'test.com',
                    'domain.com', 'yoursite.com', 'placeholder', 'facebook.com',
                    'instagram.com', 'twitter.com'
                ]):
                    valid_emails.append(email)

            if not valid_emails:
                return contacts

            # Get business name from title or first heading
            business_name = None
            title = soup.find('title')
            if title:
                business_name = title.get_text().strip()

            if not business_name or len(business_name) > 100:
                h1 = soup.find('h1')
                if h1:
                    business_name = h1.get_text().strip()

            if not business_name:
                business_name = urlparse(url).netloc.replace('www.', '').replace('.com', '').title()

            # Create contact entries
            for email in valid_emails[:2]:  # Limit to 2 emails per site
                if email in self.existing_emails:
                    continue

                contact = {
                    'business_name': business_name[:80],
                    'email': email,
                    'website': url,
                    'platform': 'Direct Web',
                    'content_snippet': page_text[:200]
                }

                contacts.append(contact)
                self.existing_emails.add(email)

                logger.info(f"Found contact: {email} - {business_name}")

        except Exception as e:
            logger.debug(f"Error extracting contact info from {url}: {e}")

        return contacts

    def scrape_healing_directories(self) -> List[Dict]:
        """Scrape professional healing directories"""
        logger.info("Scraping healing directories...")
        contacts = []

        for directory in self.healing_directories:
            try:
                logger.info(f"Scraping {directory['name']}...")

                for path in directory['search_paths']:
                    url = directory['base_url'] + path

                    try:
                        logger.info(f"Checking: {url}")

                        response = self.session.get(url, timeout=15)
                        if response.status_code != 200:
                            continue

                        soup = BeautifulSoup(response.content, 'html.parser')

                        # Extract contacts from this page
                        page_contacts = self.extract_contact_info(soup, url)
                        contacts.extend(page_contacts)

                        # Look for practitioner profile links
                        profile_links = soup.find_all('a', href=True)
                        for link in profile_links[:10]:  # Limit to 10 profiles per directory page
                            href = link['href']
                            if any(profile_indicator in href.lower() for profile_indicator in [
                                'profile', 'practitioner', 'therapist', 'healer', 'provider'
                            ]):
                                if href.startswith('/'):
                                    profile_url = directory['base_url'] + href
                                elif not href.startswith('http'):
                                    continue
                                else:
                                    profile_url = href

                                try:
                                    logger.info(f"Checking profile: {profile_url}")

                                    profile_response = self.session.get(profile_url, timeout=10)
                                    if profile_response.status_code == 200:
                                        profile_soup = BeautifulSoup(profile_response.content, 'html.parser')
                                        profile_contacts = self.extract_contact_info(profile_soup, profile_url)
                                        contacts.extend(profile_contacts)

                                    time.sleep(2)  # Rate limiting

                                except Exception as e:
                                    logger.debug(f"Error scraping profile {profile_url}: {e}")
                                    continue

                        time.sleep(3)  # Rate limiting between pages

                    except Exception as e:
                        logger.debug(f"Error scraping {url}: {e}")
                        continue

            except Exception as e:
                logger.error(f"Error scraping directory {directory['name']}: {e}")
                continue

        logger.info(f"Found {len(contacts)} contacts from healing directories")
        return contacts

    def scrape_direct_healer_websites(self) -> List[Dict]:
        """Try direct healer website patterns"""
        logger.info("Checking direct healer websites...")
        contacts = []

        # Try generic healing site patterns
        generic_sites = [
            'https://www.holistichealingcenter.com',
            'https://www.energyhealingcenter.org',
            'https://www.chakrahealingcenter.net',
            'https://www.crystalhealingcenter.com',
            'https://www.soundhealingcenter.org',
            'https://www.integratihealingarts.com',
            'https://www.wellnesscentral.net',
            'https://www.healingart.org',
            'https://www.reikicenter.com',
            'https://www.massagetherapycenter.net',
            'https://www.holisticwellnesscenter.com',
            'https://www.spiritualhealingcenter.org',
            'https://www.naturalwellnesscenter.com',
            'https://www.mindbodysoulhealing.com',
            'https://www.innerpeacecenter.org'
        ]

        for url in generic_sites:
            try:
                logger.info(f"Checking: {url}")

                response = self.session.get(url, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    site_contacts = self.extract_contact_info(soup, url)
                    contacts.extend(site_contacts)

                time.sleep(2)  # Rate limiting

            except Exception as e:
                logger.debug(f"Error checking {url}: {e}")
                continue

        # Try city-specific patterns (limited to avoid too many requests)
        city_patterns = ['newyork', 'losangeles', 'chicago', 'miami', 'seattle']
        healing_types = ['healing', 'wellness', 'massage', 'reiki']

        for city in city_patterns:
            for healing_type in healing_types:
                try:
                    url = f"https://www.{city}{healing_type}.com"
                    logger.info(f"Checking: {url}")

                    response = self.session.get(url, timeout=10)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'html.parser')
                        site_contacts = self.extract_contact_info(soup, url)
                        contacts.extend(site_contacts)

                    time.sleep(2)  # Rate limiting

                except Exception as e:
                    logger.debug(f"Error checking {url}: {e}")
                    continue

        logger.info(f"Found {len(contacts)} contacts from direct websites")
        return contacts

    def search_alternative_platforms(self) -> List[Dict]:
        """Search alternative platforms and directories"""
        logger.info("Searching alternative platforms...")
        contacts = []

        # Try Yelp-style URLs for healing services
        yelp_patterns = [
            'https://www.yelp.com/search?find_desc=massage+therapy',
            'https://www.yelp.com/search?find_desc=reiki+healing',
            'https://www.yelp.com/search?find_desc=acupuncture',
            'https://www.yelp.com/search?find_desc=holistic+healing'
        ]

        for pattern in yelp_patterns[:2]:  # Limit to avoid too many requests
            try:
                logger.info(f"Checking: {pattern}")

                response = self.session.get(pattern, timeout=15)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')

                    # Look for business links
                    business_links = soup.find_all('a', href=True)
                    for link in business_links[:5]:  # Limit per search
                        href = link['href']
                        if '/biz/' in href and href.startswith('/biz/'):
                            business_url = 'https://www.yelp.com' + href

                            try:
                                logger.info(f"Checking business: {business_url}")

                                business_response = self.session.get(business_url, timeout=10)
                                if business_response.status_code == 200:
                                    business_soup = BeautifulSoup(business_response.content, 'html.parser')
                                    business_contacts = self.extract_contact_info(business_soup, business_url)
                                    contacts.extend(business_contacts)

                                time.sleep(3)  # Rate limiting

                            except Exception as e:
                                logger.debug(f"Error checking business {business_url}: {e}")
                                continue

                time.sleep(5)  # Longer delay between search pages

            except Exception as e:
                logger.debug(f"Error searching {pattern}: {e}")
                continue

        logger.info(f"Found {len(contacts)} contacts from alternative platforms")
        return contacts

    def save_contacts_to_csv(self, contacts: List[Dict], filename_prefix: str = "direct_social_healers") -> str:
        """Save discovered contacts to CSV file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.csv"
        filepath = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['ID', 'Business_Name', 'Email', 'Website', 'Platform', 'Discovery_Method']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(contacts, 1):
                writer.writerow({
                    'ID': f"DS_{i:03d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Platform': contact.get('platform', 'Direct Web'),
                    'Discovery_Method': 'Direct Social Search'
                })

        logger.info(f"Saved {len(contacts)} contacts to: {filename}")
        return filepath

    def run_direct_discovery(self) -> str:
        """Run the complete direct healer discovery process"""
        logger.info("Starting Direct Social Healer Discovery...")
        logger.info("=" * 60)

        all_contacts = []

        # Phase 1: Healing directories
        logger.info("Phase 1: Professional healing directories...")
        directory_contacts = self.scrape_healing_directories()
        all_contacts.extend(directory_contacts)
        logger.info(f"Phase 1 complete: {len(directory_contacts)} contacts")

        # Phase 2: Direct healer websites
        logger.info("Phase 2: Direct healer websites...")
        website_contacts = self.scrape_direct_healer_websites()
        all_contacts.extend(website_contacts)
        logger.info(f"Phase 2 complete: {len(website_contacts)} contacts")

        # Phase 3: Alternative platforms
        logger.info("Phase 3: Alternative platforms...")
        platform_contacts = self.search_alternative_platforms()
        all_contacts.extend(platform_contacts)
        logger.info(f"Phase 3 complete: {len(platform_contacts)} contacts")

        # Save results
        if all_contacts:
            filepath = self.save_contacts_to_csv(all_contacts)

            logger.info("=" * 60)
            logger.info(f"DIRECT DISCOVERY COMPLETE!")
            logger.info(f"Total contacts found: {len(all_contacts)}")
            logger.info(f"Results saved to: {filepath}")
            logger.info("=" * 60)

            # Display sample results
            logger.info("Sample discovered contacts:")
            for i, contact in enumerate(all_contacts[:5], 1):
                logger.info(f"{i}. {contact['business_name']}")
                logger.info(f"   Email: {contact['email']}")
                logger.info(f"   Website: {contact['website']}")
                logger.info("")

            return filepath
        else:
            logger.warning("No new contacts discovered")
            return None

def main():
    print("DIRECT SOCIAL HEALER DISCOVERY TOOL")
    print("=" * 50)
    print("Searching for healers using direct methods (no Google dependency)")
    print("")

    discovery = DirectSocialHealerDiscovery()

    try:
        result_file = discovery.run_direct_discovery()
        if result_file:
            print(f"Success: Direct discovery completed!")
            print(f"Results saved to: {result_file}")
        else:
            print("Warning: No new contacts discovered")

    except KeyboardInterrupt:
        print("\nWarning: Discovery interrupted by user")
    except Exception as e:
        print(f"Error during discovery: {e}")
        logger.error(f"Discovery error: {e}", exc_info=True)

if __name__ == "__main__":
    main()