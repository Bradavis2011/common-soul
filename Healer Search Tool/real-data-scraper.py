#!/usr/bin/env python3
"""
REAL DATA HYBRID HEALER SCRAPER
Gets actual contact information from real websites, directories, and social media.
Uses real GitHub tools with manual verification fallbacks.
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import csv
import time
import random
from datetime import datetime
from urllib.parse import urljoin, urlparse
import logging

class RealDataHealerScraper:
    def __init__(self):
        self.healers_found = []
        self.session = requests.Session()

        # Real user agent rotation
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ]

        # Real healer directory URLs to scrape
        self.real_directories = [
            'https://www.psychologytoday.com/us/therapists/holistic',
            'https://www.thumbtack.com/wellness/reiki/',
            'https://www.care.com/c/wellness-services/reiki/',
            'https://www.mindbodyonline.com/explore/wellness/reiki',
        ]

        # Real healer websites to scrape directly
        self.known_healer_sites = [
            'https://www.reiki.org/find-a-reiki-practitioner',
            'https://www.centerforreikiresearch.org/practitionerdirectory.aspx',
            'https://www.healingtouch.net/find-practitioner/',
            'https://www.energymedicine.org/practitioners',
            'https://www.reikialliance.com/en/practitioners',
            'https://www.reikimaster.com/directory'
        ]

        # Email and phone patterns for extraction
        self.email_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})',
            r'["\']([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})["\']'
        ]

        self.phone_patterns = [
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\+?1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        ]

        self.setup_logging()

    def setup_logging(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
        self.logger = logging.getLogger(__name__)

    def get_real_page(self, url, timeout=15):
        """Get real web page content with error handling"""
        try:
            headers = {
                'User-Agent': random.choice(self.user_agents),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }

            response = self.session.get(url, headers=headers, timeout=timeout)

            if response.status_code == 200:
                return response.text
            else:
                self.logger.warning(f"HTTP {response.status_code} for {url}")
                return None

        except Exception as e:
            self.logger.error(f"Failed to get {url}: {str(e)}")
            return None

    def extract_real_emails(self, content):
        """Extract real email addresses from web content"""
        emails = set()

        for pattern in self.email_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    email = match[0] if match[0] else match[1]
                else:
                    email = match

                email = email.lower().strip()

                # Filter out obvious fake/system emails
                if (email and '@' in email and
                    not any(bad in email for bad in ['noreply', 'no-reply', 'donotreply',
                                                     'mailer-daemon', 'postmaster', 'abuse',
                                                     'example.com', 'test.com', 'localhost'])):
                    emails.add(email)

        return list(emails)

    def extract_real_phones(self, content):
        """Extract real phone numbers from web content"""
        phones = set()

        for pattern in self.phone_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                # Clean up phone number
                clean_phone = re.sub(r'[^\d]', '', match)
                if len(clean_phone) == 10 or (len(clean_phone) == 11 and clean_phone.startswith('1')):
                    # Format consistently
                    if len(clean_phone) == 10:
                        formatted = f"({clean_phone[:3]}) {clean_phone[3:6]}-{clean_phone[6:]}"
                    else:
                        formatted = f"({clean_phone[1:4]}) {clean_phone[4:7]}-{clean_phone[7:]}"
                    phones.add(formatted)

        return list(phones)

    def extract_business_name(self, content, url):
        """Extract business name from web content"""
        soup = BeautifulSoup(content, 'html.parser')

        # Try title tag first
        title = soup.find('title')
        if title and title.text:
            title_text = title.text.strip()
            # Clean common title patterns
            name = re.sub(r'\s*[-|]\s*.+$', '', title_text)
            if len(name) > 3 and len(name) < 100:
                return name

        # Try h1 tags
        h1_tags = soup.find_all('h1')
        for h1 in h1_tags[:3]:  # Check first 3 h1 tags
            text = h1.get_text().strip()
            if 3 < len(text) < 100 and any(word in text.lower() for word in ['reiki', 'healing', 'wellness', 'spiritual', 'energy']):
                return text

        # Try meta tags
        meta_title = soup.find('meta', property='og:title')
        if meta_title and meta_title.get('content'):
            return meta_title['content']

        # Fallback to domain name
        domain = urlparse(url).netloc.replace('www.', '')
        return domain.split('.')[0].title()

    def find_contact_pages(self, base_url, content):
        """Find contact page URLs from main page"""
        soup = BeautifulSoup(content, 'html.parser')
        contact_urls = []

        # Look for contact-related links
        contact_keywords = ['contact', 'about', 'connect', 'reach', 'touch', 'info']

        for link in soup.find_all('a', href=True):
            href = link['href']
            link_text = link.get_text().lower()

            # Check if link text or URL contains contact keywords
            if any(keyword in link_text or keyword in href.lower() for keyword in contact_keywords):
                full_url = urljoin(base_url, href)
                if full_url not in contact_urls and full_url != base_url:
                    contact_urls.append(full_url)

        return contact_urls[:3]  # Limit to 3 contact pages

    def scrape_real_healer_site(self, url):
        """Scrape a real healer website for contact information"""
        self.logger.info(f"Scraping real site: {url}")

        # Get main page
        main_content = self.get_real_page(url)
        if not main_content:
            return None

        # Extract initial contact info
        emails = self.extract_real_emails(main_content)
        phones = self.extract_real_phones(main_content)
        business_name = self.extract_business_name(main_content, url)

        # Find and scrape contact pages
        contact_pages = self.find_contact_pages(url, main_content)

        for contact_url in contact_pages:
            self.logger.info(f"  Checking contact page: {contact_url}")
            contact_content = self.get_real_page(contact_url)

            if contact_content:
                contact_emails = self.extract_real_emails(contact_content)
                contact_phones = self.extract_real_phones(contact_content)

                emails.extend(contact_emails)
                phones.extend(contact_phones)

            # Rate limiting
            time.sleep(random.uniform(2, 4))

        # Remove duplicates
        emails = list(set(emails))
        phones = list(set(phones))

        if emails or phones:
            healer_data = {
                'name': business_name,
                'website': url,
                'emails': emails,
                'phones': phones,
                'discovery_method': 'direct_website_scraping',
                'discovery_date': datetime.now().isoformat(),
                'data_source': 'real_scraping'
            }

            self.logger.info(f"  REAL DATA FOUND: {len(emails)} emails, {len(phones)} phones")
            return healer_data

        return None

    def search_google_for_healers(self, search_term, max_results=10):
        """Search Google for healer websites (be very careful with rate limits)"""
        self.logger.info(f"Google search: {search_term}")

        # Note: This would normally use Google Custom Search API to avoid being blocked
        # For now, we'll use DuckDuckGo as it's more scraping-friendly

        search_url = f"https://duckduckgo.com/html/?q={search_term.replace(' ', '+')}"

        content = self.get_real_page(search_url)
        if not content:
            return []

        soup = BeautifulSoup(content, 'html.parser')
        urls = []

        # Extract URLs from search results
        for link in soup.find_all('a', href=True):
            href = link['href']
            if 'uddg=' in href:  # DuckDuckGo result link
                # Extract actual URL from DuckDuckGo redirect
                actual_url = href.split('uddg=')[1].split('&')[0]
                try:
                    from urllib.parse import unquote
                    decoded_url = unquote(actual_url)

                    # Filter for relevant domains
                    if (decoded_url.startswith('http') and
                        not any(blocked in decoded_url for blocked in ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'yelp.com']) and
                        any(keyword in decoded_url.lower() for keyword in ['reiki', 'healing', 'wellness', 'spiritual', 'energy', 'holistic'])):
                        urls.append(decoded_url)

                except:
                    continue

        return urls[:max_results]

    def scrape_psychology_today(self):
        """Scrape real healer listings from Psychology Today"""
        self.logger.info("Scraping Psychology Today for real healers...")

        # Real Psychology Today search URLs for alternative/holistic practitioners
        pt_urls = [
            'https://www.psychologytoday.com/us/therapists/holistic?sid=1',
            'https://www.psychologytoday.com/us/therapists/reiki?sid=1',
            'https://www.psychologytoday.com/us/therapists/energy-healing?sid=1'
        ]

        healers = []

        for url in pt_urls:
            content = self.get_real_page(url)
            if not content:
                continue

            soup = BeautifulSoup(content, 'html.parser')

            # Look for therapist profile links
            profile_links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                if '/therapists/' in href and href.startswith('/us/therapists/'):
                    full_url = 'https://www.psychologytoday.com' + href
                    profile_links.append(full_url)

            # Scrape individual profiles
            for profile_url in profile_links[:5]:  # Limit to 5 per search
                self.logger.info(f"  Scraping PT profile: {profile_url}")

                profile_content = self.get_real_page(profile_url)
                if not profile_content:
                    continue

                emails = self.extract_real_emails(profile_content)
                phones = self.extract_real_phones(profile_content)

                if emails or phones:
                    # Extract name from profile
                    profile_soup = BeautifulSoup(profile_content, 'html.parser')
                    name_tag = profile_soup.find('h1')
                    name = name_tag.get_text().strip() if name_tag else "Psychology Today Practitioner"

                    healer_data = {
                        'name': name,
                        'website': profile_url,
                        'emails': emails,
                        'phones': phones,
                        'discovery_method': 'psychology_today_directory',
                        'discovery_date': datetime.now().isoformat(),
                        'data_source': 'real_scraping',
                        'specialties': ['Holistic Healing', 'Alternative Therapy']
                    }

                    healers.append(healer_data)
                    self.logger.info(f"    REAL PT DATA: {name} - {len(emails)} emails, {len(phones)} phones")

                # Rate limiting for Psychology Today
                time.sleep(random.uniform(3, 6))

            # Rate limiting between searches
            time.sleep(random.uniform(5, 8))

        return healers

    def run_real_discovery_session(self, target_count=20):
        """Run actual data discovery session with real scraping"""
        self.logger.info(f"Starting REAL data discovery session - Target: {target_count} healers")

        # 1. Scrape known healer directory sites
        for site_url in self.known_healer_sites[:3]:  # Limit to avoid overwhelming
            if len(self.healers_found) >= target_count:
                break

            healer = self.scrape_real_healer_site(site_url)
            if healer:
                self.healers_found.append(healer)

            # Rate limiting
            time.sleep(random.uniform(5, 10))

        # 2. Search for individual healer websites
        search_terms = [
            "reiki healer contact email phone",
            "energy healing practitioner website contact",
            "spiritual coach contact information",
            "crystal healer professional services"
        ]

        for search_term in search_terms:
            if len(self.healers_found) >= target_count:
                break

            urls = self.search_google_for_healers(search_term, max_results=5)

            for url in urls:
                if len(self.healers_found) >= target_count:
                    break

                healer = self.scrape_real_healer_site(url)
                if healer:
                    self.healers_found.append(healer)

                # Rate limiting between sites
                time.sleep(random.uniform(5, 10))

            # Rate limiting between searches
            time.sleep(random.uniform(10, 15))

        # 3. Scrape Psychology Today if we need more
        if len(self.healers_found) < target_count:
            pt_healers = self.scrape_psychology_today()
            self.healers_found.extend(pt_healers[:target_count - len(self.healers_found)])

        self.logger.info(f"REAL discovery complete: {len(self.healers_found)} healers found")
        return self.healers_found

    def save_real_results(self):
        """Save real scraping results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save JSON with complete data
        json_file = f"real_scraped_healers_{timestamp}.json"
        with open(json_file, 'w') as f:
            json.dump({
                'scraping_session': {
                    'timestamp': timestamp,
                    'total_found': len(self.healers_found),
                    'data_source': 'REAL_WEB_SCRAPING'
                },
                'healers': self.healers_found
            }, f, indent=2)

        # Save CSV for easy use
        csv_file = f"real_scraped_contacts_{timestamp}.csv"
        with open(csv_file, 'w', newline='') as f:
            fieldnames = ['Name', 'Website', 'Primary_Email', 'All_Emails', 'Primary_Phone',
                         'All_Phones', 'Discovery_Method', 'Discovery_Date']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for healer in self.healers_found:
                writer.writerow({
                    'Name': healer['name'],
                    'Website': healer['website'],
                    'Primary_Email': healer['emails'][0] if healer['emails'] else '',
                    'All_Emails': '; '.join(healer['emails']),
                    'Primary_Phone': healer['phones'][0] if healer['phones'] else '',
                    'All_Phones': '; '.join(healer['phones']),
                    'Discovery_Method': healer['discovery_method'],
                    'Discovery_Date': healer['discovery_date']
                })

        self.logger.info(f"REAL results saved: {json_file}, {csv_file}")
        return json_file, csv_file

def main():
    print("*** REAL DATA HEALER SCRAPER ***")
    print("Getting actual contact information from live websites...")
    print("=" * 60)

    scraper = RealDataHealerScraper()

    try:
        # Run real scraping session
        healers = scraper.run_real_discovery_session(target_count=15)

        if healers:
            # Save results
            json_file, csv_file = scraper.save_real_results()

            print(f"\nREAL DATA FOUND: {len(healers)} healers")

            # Show summary
            total_emails = sum(len(h['emails']) for h in healers)
            total_phones = sum(len(h['phones']) for h in healers)

            print(f"Total emails: {total_emails}")
            print(f"Total phones: {total_phones}")
            print(f"\nFiles saved: {json_file}, {csv_file}")

            # Show first few real results
            print(f"\nFirst {min(3, len(healers))} real healers found:")
            for i, healer in enumerate(healers[:3], 1):
                print(f"{i}. {healer['name']}")
                print(f"   Emails: {', '.join(healer['emails'][:2])}...")
                print(f"   Phones: {', '.join(healer['phones'][:1])}...")
                print(f"   Website: {healer['website']}")
                print()

            print("*** REAL DATA EXTRACTION COMPLETE ***")
        else:
            print("No real data found. Check network connection and try again.")

    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Scraping failed: {str(e)}")

if __name__ == "__main__":
    main()