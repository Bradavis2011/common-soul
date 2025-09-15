#!/usr/bin/env python3
"""
FINAL CONSOLIDATOR
Combine all extraction results and clean to produce final 100+ contact list.
"""

import csv
import os
import re
from datetime import datetime
import glob

class FinalConsolidator:
    def __init__(self):
        self.all_contacts = []
        self.unique_emails = set()

    def clean_email(self, email):
        """Clean and validate email addresses"""
        if not email or '@' not in email:
            return None

        email = email.lower().strip()

        # Skip obviously bad emails
        bad_patterns = [
            'noreply', 'no-reply', 'donotreply', 'example.com', 'test.com',
            '.png', '.jpg', '.gif', 'sentry.io', 'sentry.zipify', 'sentry-next',
            'wixpress.com', 'godaddy.com', 'keywordacquisitions.com', 'domain.com',
            'yoursite.com', 'sprite-google', 'product_', 'mega_image', 'logo-vertical'
        ]

        if any(bad in email for bad in bad_patterns):
            return None

        # Must have valid domain structure
        if '@' not in email or '.' not in email.split('@')[1]:
            return None

        # Domain length check
        domain = email.split('@')[1]
        if len(domain) < 4 or len(domain) > 50:
            return None

        return email

    def clean_business_name(self, name):
        """Clean business names"""
        if not name:
            return "Unknown Business"

        # Remove common website cruft
        name = re.sub(r'\s*[-|]\s*(Home|Welcome|Contact).*$', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s*[•�]\s*Home.*$', '', name)

        # Limit length
        if len(name) > 80:
            name = name[:80].strip()

        return name.strip() or "Unknown Business"

    def is_valid_healer_business(self, business_name, website):
        """Check if this looks like a real healer business"""
        name_lower = business_name.lower()
        website_lower = website.lower()

        # Healing-related terms
        healing_terms = [
            'reiki', 'energy', 'healing', 'spiritual', 'chakra', 'crystal',
            'holistic', 'wellness', 'meditation', 'therapy', 'massage',
            'sound', 'vibration', 'shamanic', 'intuitive', 'psychic',
            'life coach', 'counseling', 'ayurvedic', 'acupuncture'
        ]

        # Must contain healing terms
        has_healing_terms = any(term in name_lower or term in website_lower for term in healing_terms)

        # Exclude non-healing businesses
        exclude_terms = ['hvac', 'plumbing', 'construction', 'real estate', 'insurance']
        has_exclude_terms = any(term in name_lower for term in exclude_terms)

        return has_healing_terms and not has_exclude_terms

    def load_csv_results(self, csv_file):
        """Load contacts from a CSV file"""
        contacts = []

        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Try different column name patterns
                    email = (row.get('Email') or
                            row.get('Primary_Email') or
                            row.get('All_Emails', '').split(';')[0]).strip()

                    business_name = (row.get('Business_Name') or
                                   row.get('Name') or
                                   row.get('Contact_Name', '')).strip()

                    website = (row.get('Website') or
                             row.get('website', '')).strip()

                    # Clean the data
                    clean_email = self.clean_email(email)
                    clean_name = self.clean_business_name(business_name)

                    if clean_email and clean_name and website:
                        if self.is_valid_healer_business(clean_name, website):
                            contacts.append({
                                'business_name': clean_name,
                                'email': clean_email,
                                'website': website,
                                'source_file': os.path.basename(csv_file)
                            })

        except Exception as e:
            print(f"Error loading {csv_file}: {e}")

        return contacts

    def consolidate_all_results(self):
        """Find and consolidate all CSV results files"""
        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')

        # Find all CSV files
        csv_files = glob.glob(os.path.join(results_dir, '*.csv'))

        print(f"Found {len(csv_files)} CSV files to consolidate:")
        for csv_file in csv_files:
            print(f"  - {os.path.basename(csv_file)}")

        # Load contacts from all files
        for csv_file in csv_files:
            contacts = self.load_csv_results(csv_file)
            print(f"Loaded {len(contacts)} valid contacts from {os.path.basename(csv_file)}")

            for contact in contacts:
                # Check for duplicates
                if contact['email'] not in self.unique_emails:
                    self.unique_emails.add(contact['email'])
                    self.all_contacts.append(contact)

        print(f"\nTotal unique contacts after consolidation: {len(self.all_contacts)}")
        return self.all_contacts

    def save_final_consolidated_results(self):
        """Save the final consolidated results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results')
        exports_dir = os.path.join(results_dir, 'exports')
        os.makedirs(exports_dir, exist_ok=True)

        # Final consolidated contact list
        final_csv = os.path.join(exports_dir, f"FINAL_CONSOLIDATED_healer_contacts_{timestamp}.csv")
        with open(final_csv, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website', 'Source_File', 'Quality_Score']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(self.all_contacts, 1):
                # Assign quality score based on email domain and business name
                quality_score = self.calculate_quality_score(contact)

                writer.writerow({
                    'Contact_ID': f"FINAL_{i:04d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Source_File': contact['source_file'],
                    'Quality_Score': quality_score
                })

        # Create high-quality subset (score >= 7)
        high_quality_csv = os.path.join(exports_dir, f"HIGH_QUALITY_healer_contacts_{timestamp}.csv")
        high_quality_contacts = [c for c in self.all_contacts if self.calculate_quality_score(c) >= 7]

        with open(high_quality_csv, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Contact_ID', 'Business_Name', 'Email', 'Website', 'Quality_Score']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(high_quality_contacts, 1):
                writer.writerow({
                    'Contact_ID': f"HQ_{i:04d}",
                    'Business_Name': contact['business_name'],
                    'Email': contact['email'],
                    'Website': contact['website'],
                    'Quality_Score': self.calculate_quality_score(contact)
                })

        return (os.path.basename(final_csv), os.path.basename(high_quality_csv),
                len(self.all_contacts), len(high_quality_contacts))

    def calculate_quality_score(self, contact):
        """Calculate quality score for a contact (1-10)"""
        score = 5  # Base score

        email = contact['email']
        business_name = contact['business_name'].lower()
        website = contact['website'].lower()

        # Email quality
        if email.endswith(('.com', '.org', '.net')):
            score += 1

        if any(domain in email for domain in ['gmail.com', 'yahoo.com', 'hotmail.com']):
            score += 1  # Personal emails are often more responsive

        # Business name quality
        if any(term in business_name for term in ['reiki', 'healing', 'spiritual', 'energy']):
            score += 1

        if len(business_name) > 10 and 'unknown' not in business_name:
            score += 1

        # Website quality
        if website.startswith('https://'):
            score += 1

        if any(term in website for term in ['healing', 'reiki', 'spiritual', 'energy']):
            score += 1

        # Penalize obvious issues
        if any(bad in email for bad in ['20info@', 'filler@', 'user@']):
            score -= 2

        return min(10, max(1, score))

def main():
    print("FINAL HEALER CONTACT CONSOLIDATOR")
    print("Combining all extraction results into final contact list")
    print("=" * 65)

    consolidator = FinalConsolidator()
    contacts = consolidator.consolidate_all_results()

    if contacts:
        final_file, hq_file, total_contacts, hq_contacts = consolidator.save_final_consolidated_results()

        print(f"\nFINAL CONSOLIDATION COMPLETE:")
        print(f"Total unique contacts: {total_contacts}")
        print(f"High-quality contacts: {hq_contacts}")
        print(f"Files created:")
        print(f"  - Complete list: {final_file}")
        print(f"  - High-quality list: {hq_file}")

        if total_contacts >= 100:
            print(f"\n✅ SUCCESS: Found {total_contacts} unique healer contacts!")
        else:
            print(f"\n⚠️  Found {total_contacts} contacts - need more comprehensive search")

        print(f"\nTop 20 high-quality contacts:")
        high_quality = [c for c in contacts if consolidator.calculate_quality_score(c) >= 7][:20]

        for i, contact in enumerate(high_quality, 1):
            score = consolidator.calculate_quality_score(contact)
            print(f"{i}. {contact['business_name']}")
            print(f"   Email: {contact['email']}")
            print(f"   Website: {contact['website']}")
            print(f"   Quality: {score}/10")
            print()

    else:
        print("No contacts found to consolidate.")

if __name__ == "__main__":
    main()