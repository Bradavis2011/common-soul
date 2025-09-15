#!/usr/bin/env python3
"""
ACTUAL COUNT - Get the real number of unique healer contacts
"""
import csv
import os
import glob

def get_actual_count():
    results_dir = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports')
    csv_files = glob.glob(os.path.join(results_dir, '*.csv'))

    unique_emails = set()
    all_contacts = []

    print("ACTUAL HEALER CONTACT COUNT")
    print("=" * 40)
    print(f"Found {len(csv_files)} CSV files to analyze:")

    for csv_file in csv_files:
        filename = os.path.basename(csv_file)
        print(f"  - {filename}")

        contacts_in_file = 0
        new_contacts_in_file = 0

        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    contacts_in_file += 1

                    # Get email from various column patterns
                    email = (row.get('Email') or
                            row.get('Primary_Email') or
                            row.get('email', '')).strip().lower()

                    business_name = (row.get('Business_Name') or
                                   row.get('Name') or
                                   row.get('business_name') or
                                   row.get('Contact_Name', '')).strip()

                    website = (row.get('Website') or
                             row.get('website', '')).strip()

                    # Validate email
                    if email and '@' in email and len(email) > 5:
                        # Skip obvious junk emails
                        if not any(bad in email for bad in [
                            'noreply', 'no-reply', 'example.com', 'test.com',
                            '.png', '.jpg', 'sentry.io', 'godaddy.com',
                            'user@domain.com', 'yourname@'
                        ]):
                            if email not in unique_emails:
                                unique_emails.add(email)
                                all_contacts.append({
                                    'email': email,
                                    'business_name': business_name or 'Unknown',
                                    'website': website or 'Unknown',
                                    'source_file': filename
                                })
                                new_contacts_in_file += 1

        except Exception as e:
            print(f"    Error reading {filename}: {e}")
            continue

        print(f"    {contacts_in_file} total rows, {new_contacts_in_file} new unique emails")

    print(f"\nFINAL ACTUAL COUNT:")
    print(f"Unique healer email contacts: {len(unique_emails)}")

    if len(all_contacts) >= 100:
        print(f"✅ SUCCESS: Found {len(all_contacts)} contacts (exceeded 100 target!)")
    else:
        print(f"❌ Found {len(all_contacts)} contacts (need {100 - len(all_contacts)} more)")

    # Show sample of contacts
    print(f"\nSample of unique contacts found:")
    for i, contact in enumerate(all_contacts[:20], 1):
        print(f"{i}. {contact['email']} - {contact['business_name'][:50]}")

    # Save final accurate list
    timestamp = "FINAL_ACCURATE_COUNT"
    final_csv = os.path.join(results_dir, f"{timestamp}.csv")

    with open(final_csv, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['Contact_ID', 'Email', 'Business_Name', 'Website', 'Source_File']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i, contact in enumerate(all_contacts, 1):
            writer.writerow({
                'Contact_ID': f"FINAL_{i:04d}",
                'Email': contact['email'],
                'Business_Name': contact['business_name'],
                'Website': contact['website'],
                'Source_File': contact['source_file']
            })

    print(f"\nSaved accurate final list: {os.path.basename(final_csv)}")
    return len(all_contacts)

if __name__ == "__main__":
    count = get_actual_count()