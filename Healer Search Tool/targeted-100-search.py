#!/usr/bin/env python3
"""
TARGETED 100 SEARCH
Use real healer networks and associations to quickly find 51+ more contacts.
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
from datetime import datetime
import os
import glob

class Targeted100Search:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        self.existing_emails = set()
        self.load_existing_contacts()
        self.new_contacts = []

    def load_existing_contacts(self):
        """Load existing contacts"""
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

        print(f"Loaded {len(self.existing_emails)} existing emails")

    def search_real_healer_networks(self):
        """Search actual healer networks and associations"""

        # Real professional networks and associations
        networks = [
            # Reiki organizations
            ('https://www.reiki.org', 'reiki.org'),
            ('https://www.centerforreiki.com', 'Center for Reiki'),
            ('https://www.reikialliance.com', 'Reiki Alliance'),
            ('https://www.usui-reiki.org', 'Usui Reiki'),

            # Energy healing associations
            ('https://www.energyhealing.net', 'Energy Healing Network'),
            ('https://www.energymedicine.org', 'Energy Medicine'),
            ('https://www.ihht.net', 'Healing Touch'),

            # Holistic health directories
            ('https://www.ahha.org', 'American Holistic Health'),
            ('https://www.holistichealth.com', 'Holistic Health'),
            ('https://www.wellness.com', 'Wellness.com'),
            ('https://www.mindbodygreen.com', 'Mind Body Green'),

            # Massage therapy
            ('https://www.massagetherapy.com', 'Massage Therapy'),
            ('https://www.amtamassage.org', 'AMTA'),
            ('https://www.abmp.com', 'ABMP'),

            # Yoga and meditation
            ('https://www.yogaalliance.org', 'Yoga Alliance'),
            ('https://www.iyengar-yoga.org', 'Iyengar Yoga'),
            ('https://www.meditation.org', 'Meditation'),

            # Alternative medicine
            ('https://www.naturopathic.org', 'Naturopathic'),
            ('https://www.homeopathic.org', 'Homeopathic'),
            ('https://www.ayurvedichealing.net', 'Ayurvedic'),
            ('https://www.acupuncture.org', 'Acupuncture'),

            # Spiritual and metaphysical
            ('https://www.spiritualhealing.org', 'Spiritual Healing'),
            ('https://www.psychic.org', 'Psychic'),
            ('https://www.metaphysical.org', 'Metaphysical'),

            # Sound and crystal healing
            ('https://www.soundhealingnetwork.org', 'Sound Healing'),
            ('https://www.crystalhealing.com', 'Crystal Healing'),
            ('https://www.singingbowls.com', 'Singing Bowls'),

            # Regional networks
            ('https://www.nyholistic.org', 'NY Holistic'),
            ('https://www.californiahealers.org', 'California Healers'),
            ('https://www.texasholistic.org', 'Texas Holistic'),
        ]

        # Individual practitioner sites with good networks
        practitioner_networks = [
            'https://www.deepakchopra.com',
            'https://www.carolinmyss.com',
            'https://www.louisehay.com',
            'https://www.eckharttollenow.com',
            'https://www.oprah.com/health',
            'https://www.drweil.com',
            'https://www.chopracentermeditation.com',
            'https://www.mindvalley.com',
            'https://www.gaia.com',
            'https://www.consciouslifestyle.com'
        ]

        print("Searching real healer networks and associations...")

        for url, name in networks:
            try:
                print(f"Searching {name}...")
                contacts = self.extract_from_network(url)
                self.new_contacts.extend(contacts)

                if len(self.new_contacts) >= 51:  # Need 51 more
                    break

                time.sleep(1)

            except Exception as e:
                print(f"Error with {name}: {e}")
                continue

        # Search practitioner networks if still need more
        if len(self.new_contacts) < 51:
            for url in practitioner_networks:
                try:
                    contacts = self.extract_from_network(url)
                    self.new_contacts.extend(contacts)

                    if len(self.new_contacts) >= 51:
                        break

                    time.sleep(1)

                except:
                    continue

        return self.new_contacts

    def extract_from_network(self, url):
        """Extract contacts from a healer network site"""
        contacts = []

        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return contacts

            content = response.text
            soup = BeautifulSoup(content, 'html.parser')

            # Extract direct emails from the site
            emails = self.extract_emails(content)

            for email in emails:
                if email not in self.existing_emails:
                    business_name = self.get_site_name(url, soup)
                    contacts.append({
                        'email': email,
                        'business_name': business_name,
                        'website': url,
                        'source': 'network'
                    })
                    self.existing_emails.add(email)
                    print(f"FOUND ({len(self.existing_emails)}): {email}")

            # Look for practitioner directories or member pages
            member_links = []
            for link in soup.find_all('a', href=True):
                href = link.get('href').lower()
                text = link.get_text().lower()

                if any(term in href or term in text for term in [
                    'practitioner', 'member', 'directory', 'find-a', 'therapist',
                    'healer', 'provider', 'professional'
                ]):
                    full_url = self.make_absolute_url(url, link.get('href'))
                    if full_url not in member_links:
                        member_links.append(full_url)

            # Extract from member pages
            for member_url in member_links[:5]:  # Limit to prevent overload
                try:
                    time.sleep(0.5)
                    member_contacts = self.extract_from_member_page(member_url)
                    contacts.extend(member_contacts)

                    if len(contacts) >= 10:  # Limit per site
                        break

                except:
                    continue

        except Exception as e:
            print(f"Error extracting from {url}: {e}")

        return contacts

    def extract_from_member_page(self, url):
        """Extract contacts from member directory pages"""
        contacts = []

        try:
            response = self.session.get(url, timeout=8)
            if response.status_code != 200:
                return contacts

            content = response.text
            emails = self.extract_emails(content)

            soup = BeautifulSoup(content, 'html.parser')
            page_name = self.get_site_name(url, soup)

            for email in emails:
                if email not in self.existing_emails:
                    contacts.append({
                        'email': email,
                        'business_name': page_name,
                        'website': url,
                        'source': 'member_directory'
                    })
                    self.existing_emails.add(email)
                    print(f"FOUND ({len(self.existing_emails)}): {email}")

        except:
            pass

        return contacts

    def extract_emails(self, content):
        """Extract clean emails from content"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, content, re.IGNORECASE)

        clean_emails = []
        for email in emails:
            email = email.lower()

            # Skip bad emails
            if any(bad in email for bad in [
                'noreply', 'no-reply', 'example.com', 'test.com', '.png', '.jpg',
                'sentry.io', 'godaddy.com', 'wixpress.com', 'support@', 'admin@'
            ]):
                continue

            # Basic validation
            if '@' in email and '.' in email.split('@')[1]:
                domain = email.split('@')[1]
                if 4 <= len(domain) <= 30:
                    clean_emails.append(email)

        return clean_emails

    def get_site_name(self, url, soup):
        """Get site/business name"""
        title = soup.find('title')
        if title:
            name = title.get_text().strip()[:80]
            if name:
                return name

        # Fall back to domain
        domain = url.split('//')[1].split('/')[0].replace('www.', '')
        return domain.replace('-', ' ').title()

    def make_absolute_url(self, base_url, link):
        """Convert relative URLs to absolute"""
        if link.startswith('http'):
            return link
        elif link.startswith('/'):
            base = base_url.split('/')[0] + '//' + base_url.split('/')[2]
            return base + link
        else:
            return base_url.rstrip('/') + '/' + link

    def save_targeted_results(self):
        """Save the new contacts"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
        os.makedirs(results_dir, exist_ok=True)

        csv_file = os.path.join(results_dir, f"TARGETED_100_contacts_{timestamp}.csv")
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website', 'Source']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(self.new_contacts, 1):
                writer.writerow({
                    'Contact_ID': f"T100_{i:04d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Source': contact['source']
                })

        return os.path.basename(csv_file)

def main():
    print("TARGETED SEARCH FOR 100 HEALER CONTACTS")
    print("Using real healer networks and associations")
    print("=" * 60)

    searcher = Targeted100Search()

    current = len(searcher.existing_emails)
    needed = max(0, 100 - current)

    print(f"Current contacts: {current}")
    print(f"Target: 100")
    print(f"Need to find: {needed}")
    print()

    if needed <= 0:
        print("Already have 100+ contacts!")
        return

    # Run the search
    new_contacts = searcher.search_real_healer_networks()

    final_total = current + len(new_contacts)

    print(f"\nTARGETED SEARCH COMPLETE:")
    print(f"New contacts found: {len(new_contacts)}")
    print(f"TOTAL CONTACTS: {final_total}")

    if new_contacts:
        csv_file = searcher.save_targeted_results()
        print(f"Results saved: {csv_file}")

        print(f"\nNew contacts preview:")
        for i, contact in enumerate(new_contacts[:15], 1):
            print(f"{i}. {contact['email']} - {contact['business_name'][:50]}")

    if final_total >= 100:
        print(f"\n🎉 SUCCESS: REACHED {final_total} TOTAL CONTACTS!")
    else:
        print(f"\nStill need {100 - final_total} more contacts")

if __name__ == "__main__":
    main()