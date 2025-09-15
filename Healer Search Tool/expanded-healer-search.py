#!/usr/bin/env python3
"""
EXPANDED HEALER SEARCH TOOL
Find 100+ real healer websites through comprehensive search.
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import csv
import time
from datetime import datetime
import logging
import os

class ExpandedHealerSearch:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        })

        self.found_urls = set()
        self.healers_found = []

        # Comprehensive search terms for finding healers
        self.search_terms = [
            'reiki practitioners United States',
            'energy healers directory',
            'spiritual healing practitioners',
            'crystal healing therapists',
            'chakra balancing healers',
            'holistic energy workers',
            'sound healing practitioners',
            'meditation teachers directory',
            'shamanic healing practitioners',
            'psychic healers',
            'intuitive energy workers',
            'alternative healing modalities',
            'spiritual life coaches',
            'kundalini practitioners',
            'pranic healing therapists',
            'acupuncture energy workers',
            'therapeutic touch healers',
            'healing touch practitioners',
            'biofield therapy specialists',
            'vibrational healing experts',
            'breathwork facilitators',
            'somatic healing practitioners',
            'trauma healing specialists',
            'grief counselors spiritual',
            'past life regression therapists',
            'akashic records readers',
            'soul retrieval practitioners',
            'sacred geometry healers',
            'light language healers',
            'frequency healing specialists',
            'quantum healing practitioners'
        ]

        # Directory sites to scrape
        self.directory_sites = [
            'https://www.psychologytoday.com/us/therapists/energy-healing',
            'https://www.wellnessliving.com/practitioners',
            'https://www.mindbodygreen.com/practitioners',
            'https://www.holistichealthpractitioner.org',
            'https://www.energyhealingassociation.org',
            'https://www.reikiassociation.net',
            'https://www.healingenergyservices.com',
            'https://www.spiritualhealingnetwork.org',
            'https://www.integrativehealing.org',
            'https://www.holistichealth.com'
        ]

        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def search_healing_websites(self, search_term):
        """Search for healing websites using DuckDuckGo"""
        try:
            search_url = f"https://duckduckgo.com/html/?q={search_term.replace(' ', '+')}"
            response = self.session.get(search_url, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                links = soup.find_all('a', href=True)

                urls_found = 0
                for link in links:
                    href = link.get('href')
                    if href and href.startswith('http') and self.is_healing_website(href):
                        if href not in self.found_urls:
                            self.found_urls.add(href)
                            urls_found += 1

                        if urls_found >= 10:  # Limit per search
                            break

            time.sleep(3)  # Rate limiting

        except Exception as e:
            self.logger.error(f"Search failed for {search_term}: {str(e)}")

    def is_healing_website(self, url):
        """Check if URL is likely a healing website"""
        # Skip obvious non-healing sites
        skip_domains = [
            'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
            'youtube.com', 'yelp.com', 'google.com', 'wikipedia.org',
            'amazon.com', 'ebay.com', 'pinterest.com', 'tiktok.com',
            'psychologytoday.com', 'groupon.com', 'indeed.com'
        ]

        for domain in skip_domains:
            if domain in url.lower():
                return False

        # Look for healing-related terms in URL
        healing_terms = [
            'reiki', 'energy', 'healing', 'spiritual', 'holistic',
            'chakra', 'crystal', 'wellness', 'meditation', 'therapy',
            'counseling', 'coach', 'practitioner', 'alternative'
        ]

        url_lower = url.lower()
        return any(term in url_lower for term in healing_terms)

    def extract_contact_info(self, url):
        """Extract contact information from healer website"""
        self.logger.info(f"Extracting from: {url}")

        try:
            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                return None

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Check if it's actually a healing-related site
            if not self.is_healing_related_content(content.lower()):
                return None

            # Extract emails only (as requested)
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, content, re.IGNORECASE)

            # Clean and filter emails
            clean_emails = []
            for email in emails:
                email = email.lower()
                if (email not in clean_emails and
                    '@' in email and
                    not any(bad in email for bad in [
                        'noreply', 'example.', 'test@', 'admin@', 'info@godaddy',
                        'support@', 'no-reply', 'donotreply', '@sentry', '@wixpress'
                    ])):
                    clean_emails.append(email)
                    if len(clean_emails) >= 2:  # Limit to 2 emails per site
                        break

            # Extract business name
            title_tag = soup.find('title')
            if title_tag:
                business_name = title_tag.get_text().strip()
                business_name = re.sub(r'\s*[-|]\s*.+$', '', business_name)
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
            self.logger.error(f"Failed to extract from {url}: {str(e)}")

        return None

    def is_healing_related_content(self, content):
        """Check if website content is healing-related"""
        # Exclude non-healing terms
        exclude_terms = [
            'heating', 'hvac', 'furnace', 'air conditioning', 'plumbing',
            'electrical', 'utility', 'gas', 'electric company', 'contractor',
            'construction', 'real estate', 'insurance', 'financial',
            'automotive', 'restaurant', 'retail', 'shopping'
        ]

        # Required healing terms
        healing_terms = [
            'reiki', 'energy healing', 'spiritual healing', 'chakra',
            'crystal healing', 'holistic', 'wellness', 'meditation',
            'shamanic', 'intuitive', 'psychic', 'therapeutic touch',
            'healing touch', 'pranic healing', 'sound healing',
            'vibrational healing', 'biofield', 'alternative healing'
        ]

        # Check for exclusions first
        if any(term in content for term in exclude_terms):
            return False

        # Check for healing terms
        return any(term in content for term in healing_terms)

    def run_comprehensive_search(self):
        """Run comprehensive search for 100+ healers"""
        self.logger.info("Starting comprehensive healer search...")

        # Phase 1: Search engine discovery
        for term in self.search_terms:
            self.logger.info(f"Searching for: {term}")
            self.search_healing_websites(term)

            if len(self.found_urls) >= 200:  # Enough URLs to find 100 contacts
                break

        self.logger.info(f"Found {len(self.found_urls)} potential healing websites")

        # Phase 2: Extract contacts from all URLs
        for url in list(self.found_urls):
            try:
                healer_data = self.extract_contact_info(url)
                if healer_data:
                    self.healers_found.append(healer_data)
                    self.logger.info(f"REAL DATA FOUND: {healer_data['name']} - {len(healer_data['emails'])} emails")

                    if len(self.healers_found) >= 100:
                        break

                time.sleep(2)  # Rate limiting

            except Exception as e:
                self.logger.error(f"Error processing {url}: {str(e)}")
                continue

        return self.healers_found

    def save_results(self):
        """Save results with 100+ contacts"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Ensure directories exist
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        os.makedirs(exports_dir, exist_ok=True)

        # Save comprehensive CSV
        csv_file = os.path.join(exports_dir, f"expanded_healer_contacts_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Name', 'Website', 'Primary_Email', 'All_Emails']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for healer in self.healers_found:
                writer.writerow({
                    'Name': healer['name'],
                    'Website': healer['website'],
                    'Primary_Email': healer['emails'][0] if healer['emails'] else '',
                    'All_Emails': '; '.join(healer['emails'])
                })

        return os.path.basename(csv_file)

def main():
    print("EXPANDED HEALER SEARCH - Finding 100+ Real Contacts")
    print("=" * 60)

    searcher = ExpandedHealerSearch()

    # Run comprehensive search
    healers = searcher.run_comprehensive_search()

    if len(healers) >= 100:
        csv_file = searcher.save_results()

        total_emails = sum(len(h['emails']) for h in healers)

        print(f"\nSUCCESSFUL COMPREHENSIVE SEARCH:")
        print(f"Healers found: {len(healers)}")
        print(f"Total emails: {total_emails}")
        print(f"File saved: {csv_file}")

        print(f"\nFirst 10 healers found:")
        for i, healer in enumerate(healers[:10], 1):
            print(f"{i}. {healer['name']}")
            print(f"   Email: {healer['emails'][0]}")
            print(f"   Website: {healer['website']}")
            print()
    else:
        print(f"Found {len(healers)} healers - need to expand search further")

if __name__ == "__main__":
    main()