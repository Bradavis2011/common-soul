#!/usr/bin/env python3
"""
FINAL 8 CONTACTS - QUICK SEARCH
Get the final 8 contacts to reach exactly 100.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import os
import glob

class Final8Contacts:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        self.existing_emails = set()
        self.load_all_existing()
        self.new_contacts = []

    def load_all_existing(self):
        """Load ALL existing contacts from all files"""
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
        for csv_file in glob.glob(os.path.join(results_dir, '*.csv')):
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        email = (row.get('Email') or row.get('Primary_Email') or row.get('email', '')).strip().lower()
                        if email and '@' in email and len(email) > 5:
                            self.existing_emails.add(email)
            except:
                continue

        print(f"Total existing emails loaded: {len(self.existing_emails)}")

    def quick_healer_search(self):
        """Quick search of known working healer sites for final contacts"""

        # High-probability working healer sites
        target_sites = [
            'https://www.reikihealing.com',
            'https://www.healingtouch.net',
            'https://www.soundhealing.net',
            'https://www.crystalhealing.net',
            'https://www.energyhealing.com',
            'https://www.spiritualhealing.com',
            'https://www.holistichealing.net',
            'https://www.alternativehealing.net',
            'https://www.naturalhealing.org',
            'https://www.healingcenter.net',
            'https://www.wellnesscenter.net',
            'https://www.mindfulhealing.net',
            'https://www.conscioushealing.net',
            'https://www.transformativehealing.net',
            'https://www.integrativehealing.net',
            'https://www.reikimasters.org',
            'https://www.energyworkers.net',
            'https://www.healingpractitioners.org',
            'https://www.holisticpractitioners.net',
            'https://www.spiritualcoaches.net',
            'https://www.lifescoachs.com',
            'https://www.wellnesscoaches.com',
            'https://www.meditationteachers.org',
            'https://www.yogateachers.net',
            'https://www.massagetherapists.org',
            'https://www.acupuncturists.net',
            'https://www.naturopaths.org',
            'https://www.homeopaths.net',
            'https://www.ayurvedicpractitioners.com',
            'https://www.healingartists.net'
        ]

        needed = 8
        print(f"Need to find {needed} more contacts to reach 100")

        for i, url in enumerate(target_sites):
            if len(self.new_contacts) >= needed:
                break

            try:
                print(f"Searching {url}...")
                contacts = self.extract_from_site(url)

                for contact in contacts:
                    if len(self.new_contacts) >= needed:
                        break
                    self.new_contacts.append(contact)
                    print(f"FOUND ({len(self.existing_emails) + len(self.new_contacts)}): {contact['email']}")

                time.sleep(0.5)

            except Exception as e:
                continue

        return self.new_contacts

    def extract_from_site(self, url):
        """Extract contacts from a single site"""
        contacts = []

        try:
            response = self.session.get(url, timeout=8)
            if response.status_code != 200:
                return contacts

            content = response.text

            # Must be healing-related
            if not any(term in content.lower() for term in [
                'reiki', 'healing', 'energy', 'spiritual', 'wellness', 'chakra'
            ]):
                return contacts

            # Extract emails
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, content, re.IGNORECASE)

            soup = BeautifulSoup(content, 'html.parser')

            # Get business name
            title = soup.find('title')
            business_name = title.get_text().strip()[:80] if title else url.split('//')[1].split('/')[0]

            for email in emails:
                email = email.lower()

                # Skip bad emails
                if any(bad in email for bad in [
                    'noreply', 'no-reply', 'example.com', 'test.com', '.png',
                    'sentry.io', 'godaddy.com', 'support@', 'admin@'
                ]):
                    continue

                # Check if new and valid
                if (email not in self.existing_emails and
                    '@' in email and '.' in email.split('@')[1] and
                    len(email) > 5):

                    contacts.append({
                        'email': email,
                        'business_name': business_name,
                        'website': url
                    })
                    self.existing_emails.add(email)

                    # Limit per site
                    if len(contacts) >= 3:
                        break

        except:
            pass

        return contacts

    def save_final_8(self):
        """Save the final 8 contacts"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
        os.makedirs(results_dir, exist_ok=True)

        csv_file = os.path.join(results_dir, f"FINAL_8_contacts_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(self.new_contacts, 1):
                writer.writerow({
                    'Contact_ID': f"F8_{i:04d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website']
                })

        return os.path.basename(csv_file)

def main():
    print("FINAL 8 CONTACTS SEARCH")
    print("Getting the last contacts to reach exactly 100")
    print("=" * 50)

    searcher = Final8Contacts()
    current = len(searcher.existing_emails)
    target = 100
    needed = max(0, target - current)

    print(f"Current total: {current}")
    print(f"Target: {target}")
    print(f"Need to find: {needed}")
    print()

    if needed <= 0:
        print("Already have 100+ contacts!")
        return

    # Find the final contacts
    new_contacts = searcher.quick_healer_search()
    final_total = current + len(new_contacts)

    print(f"\nFINAL SEARCH COMPLETE:")
    print(f"New contacts found: {len(new_contacts)}")
    print(f"FINAL TOTAL: {final_total}")

    if new_contacts:
        csv_file = searcher.save_final_8()
        print(f"Final contacts saved: {csv_file}")

        print(f"\nFinal new contacts:")
        for i, contact in enumerate(new_contacts, 1):
            print(f"{i}. {contact['email']} - {contact['business_name'][:60]}")

    if final_total >= 100:
        print(f"\n🎉🎉🎉 SUCCESS: REACHED {final_total} TOTAL HEALER CONTACTS! 🎉🎉🎉")
    else:
        print(f"\nStill need {100 - final_total} more contacts")

if __name__ == "__main__":
    main()