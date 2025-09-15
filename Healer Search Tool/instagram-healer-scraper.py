#!/usr/bin/env python3
"""
INSTAGRAM HEALER SCRAPER
Specialized tool for finding healers and wellness practitioners on Instagram through hashtags and profiles.

Features:
- Healing hashtag discovery
- Profile information extraction
- Bio and contact link scraping
- Integration with existing contact database
- CSV export in standardized format

Based on research of GitHub tools:
- chris-greening/instascrape
- drawrowfly/instagram-scraper
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

class InstagramHealerScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        })

        # Load existing contacts for duplicate prevention
        self.existing_emails = set()
        self.existing_names = set()
        self.discovered_profiles = []

        # Instagram healing hashtags to search
        self.healing_hashtags = [
            'reiki', 'reikihealing', 'reikimaster', 'energyhealing', 'energyhealer',
            'crystalhealing', 'crystalhealer', 'holistichealing', 'holistichealer',
            'spiritualhealing', 'spiritualhealer', 'chakrahealing', 'chakras',
            'soundhealing', 'soundhealer', 'massagetherapy', 'massagetherapist',
            'acupuncture', 'acupuncturist', 'wellness', 'wellnesscoach',
            'meditation', 'meditationteacher', 'mindfulness', 'yoga',
            'ayurveda', 'ayurvedic', 'naturopathic', 'herbalist',
            'aromatherapy', 'reflexology', 'breathwork', 'lifecoach',
            'spiritualcoach', 'wellnesspractitioner', 'holistichealth',
            'alternativemedicine', 'integrativehealth', 'naturalhealing'
        ]

        # Search terms for Google to find Instagram profiles
        self.search_templates = [
            'site:instagram.com "{hashtag}" healer contact',
            'site:instagram.com "{hashtag}" practitioner bio',
            'site:instagram.com "{hashtag}" therapist email',
            'site:instagram.com/p/ "{hashtag}" website',
            '"instagram.com" "{hashtag}" healer email'
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

    def search_google_for_instagram_profiles(self, hashtag: str, max_results: int = 15) -> List[str]:
        """Use Google search to find Instagram profiles related to healing hashtags"""
        profile_urls = []

        for template in self.search_templates[:2]:  # Limit templates to avoid too many requests
            query = template.format(hashtag=hashtag)
            search_url = f"https://www.google.com/search?q={quote(query)}&num=10"

            try:
                logger.info(f"Google search: {query}")

                response = self.session.get(search_url, timeout=15)
                if response.status_code != 200:
                    logger.warning(f"Google search failed with status: {response.status_code}")
                    continue

                soup = BeautifulSoup(response.content, 'html.parser')

                # Extract Instagram profile URLs from search results
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if 'instagram.com/' in href and 'google.com' not in href:
                        # Clean URL
                        if href.startswith('/url?q='):
                            href = href.split('/url?q=')[1].split('&')[0]

                        # Filter for profile pages (not posts)
                        if ('instagram.com/' in href and
                            '/p/' not in href and
                            '/reel/' not in href and
                            '/tv/' not in href):

                            if href not in profile_urls:
                                profile_urls.append(href)
                                logger.info(f"Found Instagram profile: {href}")

                # Rate limiting for Google
                time.sleep(random.uniform(4, 7))

                if len(profile_urls) >= max_results:
                    break

            except Exception as e:
                logger.error(f"Error searching Google for #{hashtag}: {e}")
                continue

        return profile_urls[:max_results]

    def extract_instagram_profile_info(self, profile_url: str) -> Optional[Dict]:
        """Extract information from an Instagram profile page"""
        try:
            logger.info(f"Extracting info from: {profile_url}")

            # Add Instagram-specific headers
            headers = self.session.headers.copy()
            headers.update({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            })

            response = self.session.get(profile_url, headers=headers, timeout=15)
            if response.status_code != 200:
                logger.warning(f"Failed to access Instagram profile: {response.status_code}")
                return None

            # Instagram often requires JavaScript, so we'll parse what we can from HTML
            soup = BeautifulSoup(response.content, 'html.parser')

            profile_info = {
                'url': profile_url,
                'platform': 'Instagram'
            }

            # Try to extract JSON-LD data (Instagram sometimes includes this)
            json_scripts = soup.find_all('script', type='application/ld+json')
            for script in json_scripts:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict):
                        if 'name' in data:
                            profile_info['name'] = data['name']
                        if 'description' in data:
                            profile_info['bio'] = data['description']
                except:
                    continue

            # Try to extract from meta tags
            meta_title = soup.find('meta', property='og:title')
            if meta_title and meta_title.get('content'):
                title = meta_title.get('content')
                if '(@' in title:
                    name = title.split('(@')[0].strip()
                    username = title.split('(@')[1].split(')')[0].strip()
                    profile_info['name'] = name
                    profile_info['username'] = username

            meta_description = soup.find('meta', property='og:description')
            if meta_description and meta_description.get('content'):
                profile_info['bio'] = meta_description.get('content')

            # Try to extract from title
            title_tag = soup.find('title')
            if title_tag and not profile_info.get('name'):
                title_text = title_tag.get_text()
                if '(@' in title_text:
                    profile_info['name'] = title_text.split('(@')[0].strip()

            # Extract any visible text that might contain bio or contact info
            page_text = soup.get_text()

            # Check if profile is healing-related
            healing_keywords = [
                'reiki', 'healing', 'wellness', 'holistic', 'energy', 'spiritual',
                'massage', 'therapy', 'acupuncture', 'meditation', 'yoga', 'chakra',
                'crystal', 'sound', 'aromatherapy', 'herbalist', 'naturopathic'
            ]

            is_healing_related = any(keyword in page_text.lower() for keyword in healing_keywords)
            if not is_healing_related:
                logger.info(f"Profile not healing-related: {profile_url}")
                return None

            # Try to extract contact information from bio or visible text
            emails = []
            websites = []

            # Email extraction
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            found_emails = re.findall(email_pattern, page_text)

            for email in found_emails:
                if not any(bad in email.lower() for bad in ['instagram', 'facebook', 'example', 'noreply']):
                    emails.append(email)

            # Website extraction (look for common patterns in bio)
            website_patterns = [
                r'https?://[^\s]+',
                r'www\.[^\s]+\.(com|org|net|co|me)',
                r'[a-zA-Z0-9.-]+\.(com|org|net|co|me)'
            ]

            for pattern in website_patterns:
                found_websites = re.findall(pattern, page_text, re.IGNORECASE)
                for website in found_websites:
                    if not any(exclude in website.lower() for exclude in ['instagram', 'facebook', 'twitter']):
                        websites.append(website)

            profile_info['emails'] = emails
            profile_info['websites'] = websites

            if not profile_info.get('name'):
                profile_info['name'] = 'Instagram Healer'

            logger.info(f"Extracted Instagram profile: {profile_info.get('name')} - {len(emails)} emails, {len(websites)} websites")
            return profile_info

        except Exception as e:
            logger.error(f"Error extracting Instagram profile info: {e}")
            return None

    def check_external_websites(self, profile_info: Dict) -> List[str]:
        """Check external websites found in Instagram bio for additional contact info"""
        additional_emails = []

        for website in profile_info.get('websites', []):
            try:
                # Ensure proper URL format
                if not website.startswith(('http://', 'https://')):
                    website = f"https://{website}"

                logger.info(f"Checking external website: {website}")

                response = self.session.get(website, timeout=10)
                if response.status_code == 200:
                    content = response.text

                    # Check if it's healing-related
                    if any(keyword in content.lower() for keyword in ['healing', 'therapy', 'wellness', 'massage', 'reiki']):
                        # Extract emails from the website
                        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                        found_emails = re.findall(email_pattern, content)

                        for email in found_emails:
                            if not any(bad in email.lower() for bad in ['noreply', 'example', 'test']):
                                additional_emails.append(email)
                                logger.info(f"Found email on external site: {email}")

                time.sleep(2)  # Rate limiting

            except Exception as e:
                logger.debug(f"Error checking website {website}: {e}")
                continue

        return additional_emails

    def process_instagram_profiles(self, profile_urls: List[str]) -> List[Dict]:
        """Process Instagram profile URLs and extract contact information"""
        contacts = []

        for url in profile_urls:
            try:
                profile_info = self.extract_instagram_profile_info(url)
                if not profile_info:
                    continue

                # Check for duplicate names
                name = profile_info.get('name', '').lower()
                if name in self.existing_names or name == 'instagram healer':
                    continue

                # Get emails from profile
                emails = profile_info.get('emails', [])

                # Check external websites for additional emails
                external_emails = self.check_external_websites(profile_info)
                emails.extend(external_emails)

                # If we found emails, create contact entries
                if emails:
                    main_website = profile_info.get('websites', [profile_info['url']])[0]
                    if not main_website.startswith('http'):
                        main_website = profile_info['url']

                    for email in emails[:2]:  # Limit to 2 emails per profile
                        if email.lower() in self.existing_emails:
                            continue

                        # Create business name from profile info
                        bio = profile_info.get('bio', '')
                        if bio and len(bio) > 10:
                            business_name = f"{profile_info['name']} - {bio[:50]}"
                        else:
                            business_name = f"{profile_info['name']} - Instagram Healer"

                        contact = {
                            'business_name': business_name.replace('\n', ' ').strip(),
                            'email': email,
                            'website': main_website,
                            'platform': 'Instagram',
                            'profile_url': profile_info['url'],
                            'bio': bio[:200] if bio else ''
                        }

                        contacts.append(contact)
                        self.existing_emails.add(email.lower())
                        self.existing_names.add(name)

                        logger.info(f"Added Instagram contact: {email} - {profile_info['name']}")

                # Rate limiting between profiles
                time.sleep(random.uniform(3, 6))

            except Exception as e:
                logger.error(f"Error processing Instagram profile {url}: {e}")
                continue

        return contacts

    def save_contacts_to_csv(self, contacts: List[Dict], filename_prefix: str = "instagram_healers") -> str:
        """Save discovered contacts to CSV file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.csv"
        filepath = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['ID', 'Business_Name', 'Email', 'Website', 'Platform', 'Profile_URL', 'Bio_Snippet']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(contacts, 1):
                writer.writerow({
                    'ID': f"IG_{i:03d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Platform': contact['platform'],
                    'Profile_URL': contact.get('profile_url', ''),
                    'Bio_Snippet': contact.get('bio', '')
                })

        logger.info(f"Saved {len(contacts)} Instagram contacts to: {filename}")
        return filepath

    def run_instagram_discovery(self, max_profiles_per_hashtag: int = 10) -> str:
        """Run the complete Instagram healer discovery process"""
        logger.info("Starting Instagram Healer Discovery...")
        logger.info("=" * 60)

        all_contacts = []
        total_profiles_found = 0

        # Search for each healing hashtag
        for hashtag in self.healing_hashtags[:15]:  # Limit to first 15 hashtags
            try:
                logger.info(f"Searching hashtag: #{hashtag}")

                # Find Instagram profiles via Google search
                profile_urls = self.search_google_for_instagram_profiles(
                    hashtag,
                    max_results=max_profiles_per_hashtag
                )

                if profile_urls:
                    logger.info(f"Found {len(profile_urls)} profiles for #{hashtag}")
                    total_profiles_found += len(profile_urls)

                    # Process profiles to extract contact info
                    contacts = self.process_instagram_profiles(profile_urls)
                    all_contacts.extend(contacts)

                    logger.info(f"Extracted {len(contacts)} contacts from #{hashtag} profiles")
                else:
                    logger.info(f"No profiles found for #{hashtag}")

                # Rate limiting between hashtags
                time.sleep(random.uniform(8, 12))

            except Exception as e:
                logger.error(f"Error processing hashtag #{hashtag}: {e}")
                continue

        # Save results
        if all_contacts:
            filepath = self.save_contacts_to_csv(all_contacts)

            logger.info("=" * 60)
            logger.info(f"INSTAGRAM DISCOVERY COMPLETE!")
            logger.info(f"Total profiles searched: {total_profiles_found}")
            logger.info(f"Total contacts extracted: {len(all_contacts)}")
            logger.info(f"Results saved to: {filepath}")
            logger.info("=" * 60)

            # Display sample results
            logger.info("Sample Instagram contacts discovered:")
            for i, contact in enumerate(all_contacts[:5], 1):
                logger.info(f"{i}. {contact['business_name']}")
                logger.info(f"   Email: {contact['email']}")
                logger.info(f"   Website: {contact['website']}")
                logger.info("")

            return filepath
        else:
            logger.warning("No Instagram contacts discovered")
            return None

def main():
    print("INSTAGRAM HEALER SCRAPER")
    print("=" * 40)
    print("Searching for healers and wellness practitioners on Instagram...")
    print("")

    scraper = InstagramHealerScraper()

    try:
        result_file = scraper.run_instagram_discovery(max_profiles_per_hashtag=10)
        if result_file:
            print(f"✓ Instagram discovery completed successfully!")
            print(f"✓ Results saved to: {result_file}")
        else:
            print("⚠ No Instagram contacts discovered")

    except KeyboardInterrupt:
        print("\n⚠ Instagram discovery interrupted by user")
    except Exception as e:
        print(f"❌ Error during Instagram discovery: {e}")
        logger.error(f"Instagram discovery error: {e}", exc_info=True)

if __name__ == "__main__":
    main()