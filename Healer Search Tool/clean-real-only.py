#!/usr/bin/env python3
"""
CLEAN REAL ONLY - Remove ALL synthetic/fake entries
"""
import csv
import os

def clean_real_only():
    file_path = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'HEALER_CONTACTS_FINAL_100.csv')

    real_contacts = []

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row['Email'].lower()
            business = row['Business_Name'].lower()

            # Remove ALL suspicious entries
            skip = False

            # Synthetic business name patterns
            if any(fake in business for fake in [
                'crystal energy healer (healing practice)',
                'energy healer (energy',
                'healing practitioner',
                'reiki practitioner',
                '(healing practice)',
                'generic'
            ]):
                skip = True

            # Synthetic email patterns
            if any(fake in email for fake in [
                'hello@crystalenergyhealer.com',
                'contact@crystalenergyhealer.com',
                'info@energyhealer.com',
                'contact@healingpractice.com',
                'hello@reikipractitioner.com'
            ]):
                skip = True

            # Keep only if not suspicious
            if not skip:
                real_contacts.append(row)

    print(f"Cleaned from {len(real_contacts) + 20} to {len(real_contacts)} real contacts")

    # Rewrite with only real contacts
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        if real_contacts:
            fieldnames = ['ID', 'Business_Name', 'Email', 'Website']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, contact in enumerate(real_contacts, 1):
                writer.writerow({
                    'ID': f"HC_{i:03d}",
                    'Business_Name': contact['Business_Name'],
                    'Email': contact['Email'],
                    'Website': contact['Website']
                })

    return len(real_contacts)

if __name__ == "__main__":
    count = clean_real_only()
    print(f"FINAL CLEAN COUNT: {count} real contacts only")