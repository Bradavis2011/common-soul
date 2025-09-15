#!/usr/bin/env python3
"""
REACH 100 CONTACTS - SIMPLE & AGGRESSIVE
Find 51+ more unique healer contacts to reach 100 total.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import os
import glob

class SimpleHundredSearch:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        # Load existing contacts
        self.existing_emails = set()
        self.load_existing_contacts()
        self.new_contacts = []

        print(f"Loaded {len(self.existing_emails)} existing emails to avoid duplicates")

    def load_existing_contacts(self):
        """Load existing contacts to prevent duplicates"""
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
        csv_files = glob.glob(os.path.join(results_dir, '*.csv'))

        for csv_file in csv_files:
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        email = (row.get('Email') or row.get('Primary_Email') or row.get('email', '')).strip().lower()
                        if email and '@' in email:
                            self.existing_emails.add(email)
            except:
                continue

    def generate_massive_url_list(self):
        """Generate massive list of potential healer URLs"""
        # More comprehensive base terms
        bases = [
            'soul', 'spirit', 'divine', 'sacred', 'inner', 'light', 'zen', 'harmony',
            'peace', 'flow', 'natural', 'pure', 'radiant', 'cosmic', 'mystic', 'wise',
            'gentle', 'true', 'deep', 'whole', 'clear', 'bright', 'ancient', 'modern',
            'urban', 'mountain', 'ocean', 'forest', 'desert', 'moon', 'sun', 'star',
            'earth', 'sky', 'river', 'garden', 'temple', 'sanctuary', 'haven'
        ]

        healing_types = [
            'reiki', 'energy', 'healing', 'chakra', 'crystal', 'sound', 'massage',
            'acupuncture', 'reflexology', 'aromatherapy', 'meditation', 'yoga',
            'hypnotherapy', 'counseling', 'nutrition', 'wellness', 'holistic',
            'alternative', 'natural', 'therapeutic', 'bodywork', 'mindfulness',
            'spiritual', 'shamanic', 'ayurvedic', 'homeopathic', 'naturopathic'
        ]

        suffixes = [
            'center', 'clinic', 'practice', 'studio', 'sanctuary', 'space',
            'institute', 'academy', 'school', 'collective', 'circle', 'path',
            'arts', 'works', 'therapy', 'healing', 'wellness', 'health'
        ]

        locations = [
            'ny', 'nyc', 'la', 'sf', 'chicago', 'boston', 'seattle', 'portland',
            'austin', 'denver', 'miami', 'atlanta', 'dc', 'philly', 'vegas'
        ]

        urls = []

        # Generate massive combinations
        for base in bases:
            for healing in healing_types:
                # Direct combinations
                for ext in ['.com', '.org', '.net']:
                    urls.extend([
                        f"https://www.{base}{healing}{ext}",
                        f"https://{base}-{healing}{ext}",
                        f"https://www.{base}{healing}center{ext}",
                        f"https://{base}{healing}wellness{ext}",
                        f"https://www.{healing}by{base}{ext}",
                        f"https://{healing}with{base}{ext}"
                    ])

                # With suffixes
                for suffix in suffixes[:8]:
                    for ext in ['.com', '.org']:
                        urls.extend([
                            f"https://www.{base}{healing}{suffix}{ext}",
                            f"https://{base}-{healing}-{suffix}{ext}",
                            f"https://the{base}{healing}{suffix}{ext}"
                        ])

                # With locations
                for location in locations:
                    for ext in ['.com', '.org']:
                        urls.extend([
                            f"https://www.{base}{healing}{location}{ext}",
                            f"https://{location}{base}{healing}{ext}",
                            f"https://www.{healing}{location}{ext}"
                        ])

                # Stop when we have enough
                if len(urls) >= 2000:
                    return urls[:2000]

        return urls

    def extract_emails_from_site(self, url):
        """Extract emails from a single site"""
        try:
            response = self.session.get(url, timeout=5)
            if response.status_code != 200:
                return []

            content = response.text

            # Quick healing check
            if not any(term in content.lower() for term in [
                'reiki', 'healing', 'energy', 'spiritual', 'wellness', 'chakra',
                'meditation', 'therapy', 'holistic', 'massage', 'acupuncture'
            ]):
                return []

            # Extract emails
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, content, re.IGNORECASE)

            clean_emails = []
            for email in emails:
                email = email.lower()

                # Skip bad emails
                if any(bad in email for bad in [
                    'noreply', 'no-reply', 'example.com', 'test.com', '.png',
                    'sentry.io', 'godaddy.com', 'wixpress.com'
                ]):
                    continue

                # Check if new
                if email not in self.existing_emails and '@' in email:
                    domain = email.split('@')[1]
                    if '.' in domain and 4 <= len(domain) <= 30:
                        clean_emails.append(email)
                        self.existing_emails.add(email)

            # Get business name from title
            soup = BeautifulSoup(content, 'html.parser')
            title_tag = soup.find('title')
            business_name = title_tag.get_text().strip()[:80] if title_tag else url.split('//')[1].split('/')[0]

            return [(email, business_name, url) for email in clean_emails]

        except:
            return []

    def run_massive_search(self):
        """Run massive search for healer contacts"""
        print("MASSIVE HEALER SEARCH - REACHING 100 CONTACTS")
        print("=" * 55)

        current_total = len(self.existing_emails)
        needed = 100 - current_total
        print(f"Current: {current_total}, Target: 100, Need: {needed}")

        if needed <= 0:
            print("Already have 100+ contacts!")
            return []

        urls = self.generate_massive_url_list()
        print(f"Generated {len(urls)} URLs to search")

        found_count = 0
        for i, url in enumerate(urls):
            if found_count >= needed:
                break

            try:
                new_emails = self.extract_emails_from_site(url)

                for email, business_name, website in new_emails:
                    self.new_contacts.append({
                        'email': email,
                        'business_name': business_name,
                        'website': website
                    })
                    found_count += 1
                    print(f"FOUND ({current_total + found_count}): {email} - {business_name}")

                    if found_count >= needed:
                        break

                time.sleep(0.1)  # Very fast

            except:
                continue

            if i % 200 == 0:
                print(f"Progress: {i}/{len(urls)} URLs, {found_count} new contacts found")

        return self.new_contacts

    def save_results(self):
        """Save new contacts found"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
        os.makedirs(results_dir, exist_ok=True)

        csv_file = os.path.join(results_dir, f"REACH_100_new_contacts_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(self.new_contacts, 1):
                writer.writerow({
                    'Contact_ID': f"R100_{i:04d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website']
                })

        return os.path.basename(csv_file)

def main():
    searcher = SimpleHundredSearch()

    # Run the search
    new_contacts = searcher.run_massive_search()

    # Calculate totals
    current_total = len(searcher.existing_emails)
    new_found = len(new_contacts)
    final_total = current_total + new_found

    print(f"\nSEARCH COMPLETE:")
    print(f"Previous contacts: {current_total}")
    print(f"New contacts found: {new_found}")
    print(f"TOTAL CONTACTS: {final_total}")

    if new_contacts:
        csv_file = searcher.save_results()
        print(f"New contacts saved: {csv_file}")

        print(f"\nFirst 10 new contacts:")
        for i, contact in enumerate(new_contacts[:10], 1):
            print(f"{i}. {contact['business_name']}")
            print(f"   Email: {contact['email']}")
            print(f"   Website: {contact['website']}")
            print()

    if final_total >= 100:
        print(f"🎉 SUCCESS: REACHED {final_total} HEALER CONTACTS!")
    else:
        print(f"Need {100 - final_total} more contacts")

if __name__ == "__main__":
    main()