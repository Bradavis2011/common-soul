#!/usr/bin/env python3
"""
REMOVE SYNTHETIC FINAL - Remove the example@email.com and any other synthetic
"""
import csv
import os

def remove_synthetic_final():
    file_path = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'HEALER_CONTACTS_FINAL_100.csv')

    clean_contacts = []

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row['Email'].lower()

            # Skip synthetic emails
            if any(fake in email for fake in [
                'example@email.com', 'test@', 'noreply@', 'fake@'
            ]):
                print(f"REMOVING SYNTHETIC: {row['Email']} - {row['Business_Name']}")
                continue

            clean_contacts.append(row)

    print(f"After removing synthetic: {len(clean_contacts)} real contacts")

    # Rewrite file with clean contacts only
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['ID', 'Business_Name', 'Email', 'Website']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i, contact in enumerate(clean_contacts, 1):
            writer.writerow({
                'ID': f"HC_{i:03d}",
                'Business_Name': contact['Business_Name'],
                'Email': contact['Email'],
                'Website': contact['Website']
            })

    return len(clean_contacts)

if __name__ == "__main__":
    count = remove_synthetic_final()
    print(f"FINAL CLEAN COUNT: {count} real contacts")