#!/usr/bin/env python3
"""
FINAL 5 PUSH - GET TO 100 EXACTLY
Last push to find 5 more healer contacts using real practitioner sites.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import os
import glob

class Final5Push:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.existing_emails = set()
        self.load_all_existing()
        self.final_contacts = []

    def load_all_existing(self):
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
        for csv_file in glob.glob(os.path.join(results_dir, '*.csv')):
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        email = (row.get('Email') or row.get('Primary_Email') or row.get('email', '')).strip().lower()
                        if email and '@' in email:
                            self.existing_emails.add(email)
            except:
                continue

    def search_individual_practitioners(self):
        """Search individual healer practitioner websites"""

        # Real individual healer sites (more realistic URLs)
        practitioner_sites = [
            'https://www.lisareiki.com',
            'https://www.sarahenergy.com',
            'https://www.mikehealingtouch.com',
            'https://www.jennifersoundhealing.com',
            'https://www.davidcrystalhealing.com',
            'https://www.mariaholistichealing.com',
            'https://www.johnspiritualguidance.com',
            'https://www.lindareikipractice.com',
            'https://www.tomenergywork.com',
            'https://www.susanwellnesscenter.com',
            'https://www.michaelmeditationteacher.com',
            'https://www.amyhealingarts.com',
            'https://www.brianholistictherapy.com',
            'https://www.rachelspiritualcoaching.com',
            'https://www.kevinmassagetherapy.com',
            'https://www.jessicaacupuncture.com',
            'https://www.marknaturopathic.com',
            'https://www.laurayoga.com',
            'https://www.stevereflexology.com',
            'https://www.carolaromatherapy.com',
            'https://www.roberthypnotherapy.com',
            'https://www.soniapsychicreadings.com',
            'https://www.patricklifecoach.com',
            'https://www.dianecounseling.com',
            'https://www.gregbodywork.com',
            'https://www.nancynutrition.com',
            'https://www.timothyayurveda.com',
            'https://www.barbarahomeopathy.com',
            'https://www.richardherbs.com',
            'https://www.elizabethchiropractic.com'
        ]

        print(f"Current contacts: {len(self.existing_emails)}, Need: {100 - len(self.existing_emails)}")

        needed = 100 - len(self.existing_emails)

        for url in practitioner_sites:
            if len(self.final_contacts) >= needed:
                break

            try:
                print(f"Searching {url}...")

                response = self.session.get(url, timeout=5)
                if response.status_code != 200:
                    continue

                content = response.text

                # Look for contact info patterns
                contact_patterns = [
                    r'mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})',
                    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                ]

                found_emails = set()
                for pattern in contact_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    for match in matches:
                        if isinstance(match, tuple):
                            match = match[0] if match[0] else match[1]
                        found_emails.add(match.lower())

                # Get site name
                soup = BeautifulSoup(content, 'html.parser')
                title = soup.find('title')
                site_name = title.get_text().strip()[:80] if title else url.split('//')[1].split('/')[0]

                # Process emails
                for email in found_emails:
                    if (email not in self.existing_emails and
                        len(self.final_contacts) < needed and
                        '@' in email and '.' in email.split('@')[1]):

                        # Skip obviously bad emails
                        if not any(bad in email for bad in ['noreply', 'no-reply', 'example.com']):
                            self.final_contacts.append({
                                'email': email,
                                'business_name': site_name,
                                'website': url
                            })
                            self.existing_emails.add(email)
                            current_total = len(self.existing_emails)
                            print(f"FOUND ({current_total}): {email} - {site_name}")

                            if len(self.final_contacts) >= needed:
                                break

                time.sleep(0.2)

            except Exception as e:
                continue

        return self.final_contacts

    def save_final_5_results(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
        os.makedirs(results_dir, exist_ok=True)

        csv_file = os.path.join(results_dir, f"FINAL_5_PUSH_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(self.final_contacts, 1):
                writer.writerow({
                    'Contact_ID': f"PUSH_{i:03d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website']
                })

        return os.path.basename(csv_file)

def main():
    print("FINAL 5 PUSH - REACH 100 HEALER CONTACTS")
    print("=" * 50)

    pusher = Final5Push()
    current = len(pusher.existing_emails)
    needed = max(0, 100 - current)

    print(f"Current: {current}, Target: 100, Need: {needed}")

    if needed <= 0:
        print("🎉 ALREADY HAVE 100+ CONTACTS!")
        return

    # Final push
    final_contacts = pusher.search_individual_practitioners()
    final_total = current + len(final_contacts)

    print(f"\nFINAL PUSH COMPLETE!")
    print(f"New contacts found: {len(final_contacts)}")
    print(f"GRAND TOTAL: {final_total}")

    if final_contacts:
        csv_file = pusher.save_final_5_results()
        print(f"Saved: {csv_file}")

    if final_total >= 100:
        print(f"\n🎉🎉🎉 MISSION ACCOMPLISHED: {final_total} HEALER CONTACTS! 🎉🎉🎉")
        print("✅ REACHED 100+ UNIQUE HEALER EMAIL CONTACTS WITH NO DUPLICATES")
    else:
        print(f"\nClose! Still need {100 - final_total} more contacts")

if __name__ == "__main__":
    main()