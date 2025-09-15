#!/usr/bin/env python3
"""
LINKEDIN HEALER SCRAPER
Specialized tool for finding professional healers, therapists, and wellness practitioners on LinkedIn.

Features:
- Professional healer profile discovery
- Healthcare practitioner search
- Business and contact information extraction
- Integration with existing contact database
- CSV export in standardized format

Based on research of GitHub tools:
- joeyism/linkedin_scraper
- kennethleungty/Web-Scraping-Walkthrough-HCP-Info
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
from urllib.parse import urljoin, urlparse, quote
import random
from typing import Dict, List, Set, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LinkedInHealerScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })

        # Load existing contacts for duplicate prevention
        self.existing_emails = set()
        self.existing_names = set()
        self.discovered_profiles = []

        # Professional healing specialties to search for
        self.healing_specialties = [
            'Licensed Massage Therapist',
            'Reiki Master',
            'Energy Healer',
            'Acupuncturist',
            'Licensed Acupuncturist',
            'Holistic Health Practitioner',
            'Wellness Coach',
            'Life Coach',
            'Spiritual Coach',
            'Meditation Teacher',
            'Yoga Instructor',
            'Ayurvedic Practitioner',
            'Naturopathic Doctor',
            'Therapeutic Massage',
            'Craniosacral Therapist',
            'Sound Healer',
            'Crystal Healer',
            'Aromatherapist',
            'Reflexologist',
            'Herbalist',
            'Integrative Health Coach',
            'Mindfulness Coach',
            'Breathwork Facilitator'
        ]

        # LinkedIn search query templates
        self.search_templates = [
            'site:linkedin.com/in "{specialty}" healer',
            'site:linkedin.com/in "{specialty}" practitioner',
            'site:linkedin.com/in "{specialty}" therapist',
            'site:linkedin.com/in licensed "{specialty}"',
            'site:linkedin.com/in certified "{specialty}"'
        ]

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

    def search_google_for_linkedin_profiles(self, specialty: str, max_results: int = 20) -> List[str]:
        """Use Google search to find LinkedIn profiles of healing practitioners"""
        profile_urls = []

        for template in self.search_templates:
            query = template.format(specialty=specialty)
            search_url = f"https://www.google.com/search?q={quote(query)}&num=10"

            try:
                logger.info(f"Searching: {query}")

                response = self.session.get(search_url, timeout=15)
                if response.status_code != 200:
                    logger.warning(f"Google search failed with status: {response.status_code}")
                    continue

                soup = BeautifulSoup(response.content, 'html.parser')

                # Extract LinkedIn profile URLs from search results
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if 'linkedin.com/in/' in href and 'google.com' not in href:
                        # Clean URL
                        if href.startswith('/url?q='):
                            href = href.split('/url?q=')[1].split('&')[0]

                        if href.startswith('https://linkedin.com') or href.startswith('https://www.linkedin.com'):
                            if href not in profile_urls:
                                profile_urls.append(href)
                                logger.info(f"Found LinkedIn profile: {href}")

                # Rate limiting for Google
                time.sleep(random.uniform(3, 6))

                if len(profile_urls) >= max_results:
                    break

            except Exception as e:
                logger.error(f"Error searching Google for '{specialty}': {e}")
                continue

        return profile_urls[:max_results]

    def extract_linkedin_profile_info(self, profile_url: str) -> Optional[Dict]:
        """Extract information from a LinkedIn profile page"""
        try:
            logger.info(f"Extracting info from: {profile_url}")

            response = self.session.get(profile_url, timeout=15)
            if response.status_code != 200:
                logger.warning(f"Failed to access LinkedIn profile: {response.status_code}")
                return None

            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract basic profile information
            profile_info = {
                'url': profile_url,
                'platform': 'LinkedIn'
            }

            # Try to extract name from various possible elements
            name_selectors = [
                'h1.text-heading-xlarge',
                'h1.pv-text-details__left-panel__headline',
                '.pv-text-details__left-panel h1',
                'h1',
                '.artdeco-entity-lockup__title'
            ]

            name = None
            for selector in name_selectors:
                name_elem = soup.select_one(selector)
                if name_elem and name_elem.get_text(strip=True):
                    name = name_elem.get_text(strip=True)
                    break

            if not name:
                # Try to extract from title tag
                title = soup.find('title')
                if title:
                    title_text = title.get_text()
                    if ' | LinkedIn' in title_text:
                        name = title_text.split(' | LinkedIn')[0]

            if not name:
                logger.warning(f"Could not extract name from {profile_url}")
                return None

            profile_info['name'] = name

            # Try to extract headline/title
            headline_selectors = [
                '.text-body-medium.break-words',
                '.pv-text-details__left-panel__headline',
                '.artdeco-entity-lockup__subtitle'
            ]

            headline = None
            for selector in headline_selectors:
                headline_elem = soup.select_one(selector)
                if headline_elem and headline_elem.get_text(strip=True):
                    headline = headline_elem.get_text(strip=True)
                    break

            profile_info['headline'] = headline or 'Professional'

            # Try to extract location
            location_selectors = [
                '.text-body-small.inline.t-black--light.break-words',
                '.pv-text-details__left-panel .text-body-small'
            ]

            location = None
            for selector in location_selectors:
                location_elem = soup.select_one(selector)
                if location_elem and location_elem.get_text(strip=True):
                    location = location_elem.get_text(strip=True)
                    break

            profile_info['location'] = location

            # Check if profile is healing-related
            full_text = soup.get_text().lower()
            healing_keywords = [
                'massage', 'reiki', 'healing', 'wellness', 'holistic', 'therapy',
                'acupuncture', 'naturopathic', 'energy', 'spiritual', 'meditation',
                'yoga', 'ayurveda', 'aromatherapy', 'reflexology', 'herbalist'
            ]

            is_healing_related = any(keyword in full_text for keyword in healing_keywords)
            if not is_healing_related:
                logger.info(f"Profile not healing-related: {name}")
                return None

            # Try to extract email (usually not visible on public LinkedIn)
            emails = []
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            found_emails = re.findall(email_pattern, soup.get_text())

            for email in found_emails:
                if not any(bad in email.lower() for bad in ['linkedin', 'example', 'noreply']):
                    emails.append(email)

            profile_info['emails'] = emails

            # Since direct email extraction from LinkedIn is limited,
            # we'll focus on the profile information for now
            logger.info(f"Extracted profile: {name} - {headline}")
            return profile_info

        except Exception as e:
            logger.error(f"Error extracting LinkedIn profile info: {e}")
            return None

    def find_contact_info_from_external_sources(self, profile_info: Dict) -> List[str]:
        """Try to find contact information from external sources based on profile info"""
        emails = []

        try:
            name = profile_info.get('name', '')
            headline = profile_info.get('headline', '')

            # Generate potential website URLs based on name and specialty
            name_parts = name.lower().replace(' ', '').replace('.', '').replace(',', '')

            potential_domains = [
                f"{name_parts}healing.com",
                f"{name_parts}wellness.com",
                f"{name_parts}therapy.com",
                f"{name_parts}.com",
                f"www.{name_parts}.com"
            ]

            for domain in potential_domains[:3]:  # Limit to avoid too many requests
                try:
                    test_url = f"https://{domain}"
                    logger.info(f"Checking potential website: {test_url}")

                    response = self.session.get(test_url, timeout=10)
                    if response.status_code == 200:
                        content = response.text

                        # Check if it's healing-related
                        if any(keyword in content.lower() for keyword in ['healing', 'therapy', 'wellness', 'massage']):
                            # Extract emails
                            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                            found_emails = re.findall(email_pattern, content)

                            for email in found_emails:
                                if not any(bad in email.lower() for bad in ['noreply', 'example', 'test']):
                                    emails.append(email)
                                    profile_info['website'] = test_url
                                    logger.info(f"Found website and email: {test_url} - {email}")

                    time.sleep(2)  # Rate limiting

                except Exception as e:
                    logger.debug(f"Error checking {domain}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error finding external contact info: {e}")

        return emails

    def process_profiles(self, profile_urls: List[str]) -> List[Dict]:
        """Process LinkedIn profile URLs and extract contact information"""
        contacts = []

        for url in profile_urls:
            try:
                profile_info = self.extract_linkedin_profile_info(url)
                if not profile_info:
                    continue

                # Check for duplicate names
                name = profile_info.get('name', '').lower()
                if name in self.existing_names:
                    logger.info(f"Skipping duplicate name: {profile_info.get('name')}")
                    continue

                # Try to find contact information
                emails = profile_info.get('emails', [])

                # Try external sources for contact info
                external_emails = self.find_contact_info_from_external_sources(profile_info)
                emails.extend(external_emails)

                # If we found emails, create contact entry
                if emails:
                    for email in emails:
                        if email.lower() in self.existing_emails:
                            continue

                        contact = {
                            'business_name': f"{profile_info['name']} - {profile_info.get('headline', 'Professional')}",
                            'email': email,
                            'website': profile_info.get('website', profile_info['url']),
                            'platform': 'LinkedIn',
                            'location': profile_info.get('location', ''),
                            'profile_url': profile_info['url']
                        }

                        contacts.append(contact)
                        self.existing_emails.add(email.lower())
                        self.existing_names.add(name)

                        logger.info(f"Added LinkedIn contact: {email} - {profile_info['name']}")
                        break  # Only take first email per profile

                # Rate limiting
                time.sleep(random.uniform(5, 10))

            except Exception as e:
                logger.error(f"Error processing profile {url}: {e}")
                continue

        return contacts

    def save_contacts_to_csv(self, contacts: List[Dict], filename_prefix: str = "linkedin_healers") -> str:
        """Save discovered contacts to CSV file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.csv"
        filepath = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['ID', 'Business_Name', 'Email', 'Website', 'Platform', 'Location', 'Profile_URL']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(contacts, 1):
                writer.writerow({
                    'ID': f"LI_{i:03d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Platform': contact['platform'],
                    'Location': contact.get('location', ''),
                    'Profile_URL': contact.get('profile_url', '')
                })

        logger.info(f"Saved {len(contacts)} LinkedIn contacts to: {filename}")
        return filepath

    def run_linkedin_discovery(self, max_results_per_specialty: int = 10) -> str:
        """Run the complete LinkedIn healer discovery process"""
        logger.info("Starting LinkedIn Healer Discovery...")
        logger.info("=" * 60)

        all_contacts = []
        total_profiles_found = 0

        # Search for each healing specialty
        for specialty in self.healing_specialties[:10]:  # Limit to first 10 specialties
            try:
                logger.info(f"Searching for: {specialty}")

                # Find LinkedIn profiles via Google search
                profile_urls = self.search_google_for_linkedin_profiles(
                    specialty,
                    max_results=max_results_per_specialty
                )

                if profile_urls:
                    logger.info(f"Found {len(profile_urls)} profiles for {specialty}")
                    total_profiles_found += len(profile_urls)

                    # Process profiles to extract contact info
                    contacts = self.process_profiles(profile_urls)
                    all_contacts.extend(contacts)

                    logger.info(f"Extracted {len(contacts)} contacts from {specialty} profiles")
                else:
                    logger.info(f"No profiles found for {specialty}")

                # Rate limiting between specialties
                time.sleep(random.uniform(10, 15))

            except Exception as e:
                logger.error(f"Error processing specialty '{specialty}': {e}")
                continue

        # Save results
        if all_contacts:
            filepath = self.save_contacts_to_csv(all_contacts)

            logger.info("=" * 60)
            logger.info(f"LINKEDIN DISCOVERY COMPLETE!")
            logger.info(f"Total profiles searched: {total_profiles_found}")
            logger.info(f"Total contacts extracted: {len(all_contacts)}")
            logger.info(f"Results saved to: {filepath}")
            logger.info("=" * 60)

            # Display sample results
            logger.info("Sample LinkedIn contacts discovered:")
            for i, contact in enumerate(all_contacts[:5], 1):
                logger.info(f"{i}. {contact['business_name']}")
                logger.info(f"   Email: {contact['email']}")
                logger.info(f"   Website: {contact['website']}")
                logger.info(f"   Location: {contact.get('location', 'N/A')}")
                logger.info("")

            return filepath
        else:
            logger.warning("No LinkedIn contacts discovered")
            return None

def main():
    print("LINKEDIN HEALER SCRAPER")
    print("=" * 40)
    print("Searching for professional healers and wellness practitioners on LinkedIn...")
    print("")

    scraper = LinkedInHealerScraper()

    try:
        result_file = scraper.run_linkedin_discovery(max_results_per_specialty=10)
        if result_file:
            print(f"✓ LinkedIn discovery completed successfully!")
            print(f"✓ Results saved to: {result_file}")
        else:
            print("⚠ No LinkedIn contacts discovered")

    except KeyboardInterrupt:
        print("\n⚠ LinkedIn discovery interrupted by user")
    except Exception as e:
        print(f"❌ Error during LinkedIn discovery: {e}")
        logger.error(f"LinkedIn discovery error: {e}", exc_info=True)

if __name__ == "__main__":
    main()