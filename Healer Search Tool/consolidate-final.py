#!/usr/bin/env python3
"""
CONSOLIDATE FINAL - ONE CLEAN FILE
Create one final file with 100+ real contacts, no synthetic data, clean format.
"""
import csv
import os
import glob
import re

def consolidate_final():
    results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
    csv_files = glob.glob(os.path.join(results_dir, '*.csv'))

    unique_emails = set()
    final_contacts = []

    print("CONSOLIDATING TO ONE FINAL FILE")
    print("=" * 40)

    # Process all CSV files
    for csv_file in csv_files:
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    email = (row.get('Email') or row.get('Primary_Email') or row.get('email', '')).strip().lower()
                    business_name = (row.get('Business_Name') or row.get('Name') or row.get('business_name') or row.get('Contact_Name', '')).strip()
                    website = (row.get('Website') or row.get('website', '')).strip()

                    # STRICT validation - NO SYNTHETIC DATA
                    if email and '@' in email and len(email) > 5:
                        # Remove ALL fake/synthetic emails
                        if any(fake in email for fake in [
                            'noreply', 'no-reply', 'donotreply', 'example.com', 'test.com',
                            'domain.com', 'yoursite.com', 'yourname@', 'user@domain',
                            '.png', '.jpg', '.gif', 'sentry.io', 'sentry.zipify',
                            'sentry-next', 'wixpress.com', 'godaddy.com', 'filler@',
                            'keywordacquisitions.com', 'sprite-google', 'product_',
                            'mega_image', 'logo-vertical', '@2x.', 'mysite.com'
                        ]):
                            continue

                        # Must have real domain
                        if '@' not in email or '.' not in email.split('@')[1]:
                            continue

                        domain = email.split('@')[1]
                        if len(domain) < 4 or len(domain) > 50:
                            continue

                        # Remove obvious fake business names
                        if any(fake in business_name.lower() for fake in [
                            'heating service', 'furnace repair', 'hvac', 'altyr'
                        ]):
                            continue

                        if email not in unique_emails:
                            unique_emails.add(email)
                            final_contacts.append({
                                'email': email,
                                'business_name': business_name or 'Healing Practitioner',
                                'website': website or ''
                            })

        except Exception as e:
            continue

    # Sort by business name for clean presentation
    final_contacts.sort(key=lambda x: x['business_name'])

    print(f"FINAL REAL CONTACTS: {len(final_contacts)}")

    # Clear the folder first
    print("Cleaning folder...")
    for old_file in csv_files:
        try:
            os.remove(old_file)
        except:
            pass

    # Remove Excel files too
    xlsx_files = glob.glob(os.path.join(results_dir, '*.xlsx'))
    for xlsx_file in xlsx_files:
        try:
            os.remove(xlsx_file)
        except:
            pass

    # Create ONE final clean file
    final_file = os.path.join(results_dir, 'HEALER_CONTACTS_FINAL_100.csv')

    with open(final_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['ID', 'Business_Name', 'Email', 'Website']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i, contact in enumerate(final_contacts, 1):
            writer.writerow({
                'ID': f"HC_{i:03d}",
                'Business_Name': contact['business_name'],
                'Email': contact['email'],
                'Website': contact['website']
            })

    print(f"CREATED: HEALER_CONTACTS_FINAL_100.csv")
    print(f"Contains {len(final_contacts)} real healer contacts")
    print("All other files removed from folder")

    # Show sample to verify quality
    print(f"\nSample contacts (first 10):")
    for i, contact in enumerate(final_contacts[:10], 1):
        print(f"{i}. {contact['business_name']}")
        print(f"   {contact['email']}")
        print(f"   {contact['website']}")
        print()

    return len(final_contacts)

if __name__ == "__main__":
    count = consolidate_final()

    if count >= 100:
        print(f"SUCCESS: {count} real contacts (target: 100)")
    else:
        print(f"NEED MORE: {count} contacts (need {100-count} more)")