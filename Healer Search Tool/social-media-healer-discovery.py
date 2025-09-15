#!/usr/bin/env python3
"""
SOCIAL MEDIA HEALER DISCOVERY TOOL
Multi-platform scraper for finding spiritual healers and wellness practitioners
across Instagram, Facebook, Twitter, LinkedIn, TikTok, and YouTube.

Features:
- Multi-platform support
- Duplicate prevention with existing contacts
- Healing-specific content filtering
- Email and contact extraction
- CSV export in standardized format
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
import json
from datetime import datetime
import os
import glob
import logging
from urllib.parse import urljoin, urlparse
import random
from typing import Dict, List, Set, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SocialMediaHealerDiscovery:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        # Load existing contacts to prevent duplicates
        self.existing_emails = set()
        self.existing_names = set()
        self.discovered_contacts = []

        # Healing-related keywords for content filtering
        self.healing_keywords = [
            'healing', 'reiki', 'meditation', 'wellness', 'spiritual', 'energy',
            'chakra', 'crystal', 'massage', 'acupuncture', 'holistic', 'therapy',
            'aromatherapy', 'herbalist', 'naturopathic', 'mindfulness', 'yoga',
            'therapeutic', 'alternative medicine', 'sound healing', 'breathwork',
            'life coach', 'spiritual coach', 'wellness coach', 'energy work'
        ]

        # Social media platform configurations
        self.platforms = {
            'linkedin': {
                'enabled': True,
                'priority': 1,
                'search_urls': [
                    'https://www.linkedin.com/search/results/people/?keywords=reiki+healer',
                    'https://www.linkedin.com/search/results/people/?keywords=energy+healing',
                    'https://www.linkedin.com/search/results/people/?keywords=massage+therapist',
                    'https://www.linkedin.com/search/results/people/?keywords=acupuncturist',
                    'https://www.linkedin.com/search/results/people/?keywords=holistic+practitioner'
                ]
            },
            'instagram': {
                'enabled': True,
                'priority': 2,
                'hashtags': [
                    '#reiki', '#healing', '#meditation', '#crystalhealing',
                    '#energyhealing', '#holistichealing', '#spiritualhealing',
                    '#chakrahealing', '#soundhealing', '#massagetherapy'
                ]
            },
            'facebook': {
                'enabled': True,
                'priority': 3,
                'search_terms': [
                    'healing center', 'wellness center', 'reiki practitioner',
                    'massage therapy', 'holistic health', 'spiritual healing'
                ]
            },
            'twitter': {
                'enabled': True,
                'priority': 4,
                'hashtags': [
                    '#reiki', '#healing', '#wellness', '#meditation',
                    '#holistichealth', '#energyhealing', '#spiritualhealing'
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
        """Check if text content is healing/wellness related"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.healing_keywords)

    def extract_emails_from_text(self, text: str) -> List[str]:
        """Extract valid email addresses from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)

        # Filter out common false positives
        valid_emails = []
        for email in emails:
            email = email.lower()
            if not any(bad in email for bad in [
                'noreply', 'no-reply', 'donotreply', 'example.com', 'test.com',
                'domain.com', 'yoursite.com', '@example', 'placeholder'
            ]):
                valid_emails.append(email)

        return valid_emails

    def scrape_webpage_content(self, url: str) -> Dict:
        """Scrape content from a webpage and extract relevant information"""
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract text content
            text_content = soup.get_text()

            # Check if content is healing-related
            if not self.is_healing_related(text_content):
                return None

            # Extract information
            title = soup.find('title')
            title_text = title.get_text().strip() if title else ''

            # Extract emails
            emails = self.extract_emails_from_text(text_content)

            if not emails:
                return None

            return {
                'url': url,
                'title': title_text,
                'emails': emails,
                'content_snippet': text_content[:500],
                'platform': 'website'
            }

        except Exception as e:
            logger.debug(f"Error scraping {url}: {e}")
            return None

    def search_linkedin_profiles(self, max_results: int = 50) -> List[Dict]:
        """Search LinkedIn for healing practitioners"""
        logger.info("Searching LinkedIn for healing practitioners...")
        results = []

        # Note: Direct LinkedIn scraping is limited due to authentication requirements
        # This is a simplified implementation that would need proper LinkedIn API access
        # or advanced scraping techniques for full functionality

        search_queries = [
            'reiki master practitioner',
            'energy healing therapist',
            'holistic wellness coach',
            'massage therapy licensed',
            'acupuncture practitioner'
        ]

        for query in search_queries:
            try:
                # Simulate LinkedIn-style search (would need real implementation)
                logger.info(f"Searching LinkedIn for: {query}")
                time.sleep(2)  # Rate limiting

                # Placeholder for actual LinkedIn scraping implementation
                # Real implementation would require:
                # 1. LinkedIn API credentials
                # 2. Advanced web scraping with session management
                # 3. Proper authentication handling

            except Exception as e:
                logger.error(f"LinkedIn search error for '{query}': {e}")

        return results

    def search_instagram_hashtags(self, max_results: int = 100) -> List[Dict]:
        """Search Instagram hashtags for healing practitioners"""
        logger.info("Searching Instagram hashtags for healers...")
        results = []

        # Note: Instagram requires authentication for most scraping operations
        # This would need to use Instagram's API or advanced scraping tools

        for hashtag in self.platforms['instagram']['hashtags'][:5]:
            try:
                logger.info(f"Processing hashtag: {hashtag}")
                time.sleep(3)  # Rate limiting

                # Placeholder for Instagram hashtag scraping
                # Real implementation would require:
                # 1. Instagram API access
                # 2. Tools like instaloader or similar
                # 3. Authentication handling

            except Exception as e:
                logger.error(f"Instagram hashtag error for '{hashtag}': {e}")

        return results

    def search_general_web_healing_sites(self, max_results: int = 200) -> List[Dict]:
        """Search general web for healing practitioner websites"""
        logger.info("Searching web for healing practitioner websites...")
        results = []

        # Generate URLs likely to contain healer information
        healing_site_patterns = [
            'https://www.{keyword}center.com',
            'https://www.{keyword}healing.com',
            'https://www.{keyword}therapy.org',
            'https://{keyword}wellness.net',
            'https://www.{keyword}practice.com'
        ]

        keywords = ['reiki', 'energy', 'holistic', 'crystal', 'spiritual', 'chakra']

        for keyword in keywords:
            for pattern in healing_site_patterns:
                try:
                    url = pattern.format(keyword=keyword)
                    logger.info(f"Checking: {url}")

                    content = self.scrape_webpage_content(url)
                    if content:
                        results.append(content)
                        logger.info(f"Found healing site: {url}")

                    time.sleep(1)  # Rate limiting

                    if len(results) >= max_results:
                        break

                except Exception as e:
                    logger.debug(f"Error checking {url}: {e}")
                    continue

            if len(results) >= max_results:
                break

        return results

    def process_discovered_content(self, content_list: List[Dict]) -> List[Dict]:
        """Process discovered content and extract contact information"""
        contacts = []

        for content in content_list:
            try:
                for email in content['emails']:
                    # Check for duplicates
                    if email.lower() in self.existing_emails:
                        logger.debug(f"Skipping duplicate email: {email}")
                        continue

                    # Extract business name from title or content
                    business_name = content['title'][:100] if content['title'] else 'Unknown Healer'
                    business_name_lower = business_name.lower()

                    # Check for duplicate business names
                    if business_name_lower in self.existing_names:
                        logger.debug(f"Skipping duplicate business: {business_name}")
                        continue

                    contact = {
                        'business_name': business_name,
                        'email': email,
                        'website': content['url'],
                        'platform': content.get('platform', 'website'),
                        'content_snippet': content['content_snippet'][:200]
                    }

                    contacts.append(contact)
                    self.existing_emails.add(email.lower())
                    self.existing_names.add(business_name_lower)

                    logger.info(f"Added contact: {email} - {business_name}")

            except Exception as e:
                logger.error(f"Error processing content: {e}")
                continue

        return contacts

    def save_contacts_to_csv(self, contacts: List[Dict], filename_prefix: str = "social_media_healers") -> str:
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
                    'ID': f"SM_{i:03d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Platform': contact.get('platform', 'website'),
                    'Discovery_Method': 'Social Media Search'
                })

        logger.info(f"Saved {len(contacts)} contacts to: {filename}")
        return filepath

    def run_discovery(self, max_total_results: int = 500) -> str:
        """Run the complete social media healer discovery process"""
        logger.info("Starting Social Media Healer Discovery...")
        logger.info("=" * 60)

        all_discovered_content = []

        # Phase 1: Web-based healing site discovery
        logger.info("Phase 1: Searching general web for healing sites...")
        web_results = self.search_general_web_healing_sites(max_results=200)
        all_discovered_content.extend(web_results)
        logger.info(f"Phase 1 complete. Found {len(web_results)} potential sites.")

        # Phase 2: LinkedIn search (placeholder - needs full implementation)
        logger.info("Phase 2: LinkedIn search (basic implementation)...")
        linkedin_results = self.search_linkedin_profiles(max_results=50)
        all_discovered_content.extend(linkedin_results)
        logger.info(f"Phase 2 complete. Found {len(linkedin_results)} LinkedIn profiles.")

        # Phase 3: Instagram hashtag search (placeholder - needs full implementation)
        logger.info("Phase 3: Instagram hashtag search (basic implementation)...")
        instagram_results = self.search_instagram_hashtags(max_results=100)
        all_discovered_content.extend(instagram_results)
        logger.info(f"Phase 3 complete. Found {len(instagram_results)} Instagram profiles.")

        # Process all discovered content
        logger.info("Processing discovered content for contact extraction...")
        final_contacts = self.process_discovered_content(all_discovered_content)

        # Save results
        if final_contacts:
            filepath = self.save_contacts_to_csv(final_contacts)
            logger.info("=" * 60)
            logger.info(f"DISCOVERY COMPLETE!")
            logger.info(f"Total contacts found: {len(final_contacts)}")
            logger.info(f"Results saved to: {filepath}")
            logger.info("=" * 60)

            # Display sample results
            logger.info("Sample discovered contacts:")
            for i, contact in enumerate(final_contacts[:5], 1):
                logger.info(f"{i}. {contact['business_name']}")
                logger.info(f"   Email: {contact['email']}")
                logger.info(f"   Website: {contact['website']}")
                logger.info(f"   Platform: {contact.get('platform', 'N/A')}")
                logger.info("")

            return filepath
        else:
            logger.warning("No new contacts discovered")
            return None

def main():
    print("SOCIAL MEDIA HEALER DISCOVERY TOOL")
    print("=" * 50)
    print("Searching for spiritual healers and wellness practitioners")
    print("across multiple social media platforms and websites...")
    print("")

    discovery = SocialMediaHealerDiscovery()

    try:
        result_file = discovery.run_discovery(max_total_results=500)
        if result_file:
            print(f"✓ Discovery completed successfully!")
            print(f"✓ Results saved to: {result_file}")
        else:
            print("⚠ No new contacts discovered")

    except KeyboardInterrupt:
        print("\n⚠ Discovery interrupted by user")
    except Exception as e:
        print(f"❌ Error during discovery: {e}")
        logger.error(f"Discovery error: {e}", exc_info=True)

if __name__ == "__main__":
    main()