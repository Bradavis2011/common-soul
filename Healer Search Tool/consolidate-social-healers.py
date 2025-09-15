#!/usr/bin/env python3
"""
CONSOLIDATE SOCIAL MEDIA HEALERS
Merge the 2 new verified social media healer contacts with the existing 100 healer database
"""

import csv
import os
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def consolidate_healer_contacts():
    """Consolidate social media contacts with existing healer database"""

    # File paths
    existing_file = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'HEALER_CONTACTS_FINAL_100.csv')
    social_file = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'cleaned_social_healers_20250914_014746.csv')

    # Read existing contacts
    existing_contacts = []
    existing_emails = set()

    logger.info("Loading existing 100 healer contacts...")
    with open(existing_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_contacts.append(row)
            existing_emails.add(row['Email'].lower())

    logger.info(f"Loaded {len(existing_contacts)} existing contacts")

    # Read new social media contacts
    social_contacts = []
    logger.info("Loading new social media healer contacts...")

    with open(social_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            social_contacts.append(row)

    logger.info(f"Loaded {len(social_contacts)} new social media contacts")

    # Check for duplicates and add new contacts
    new_contacts_added = []
    duplicates_found = []

    for contact in social_contacts:
        email = contact['Email'].lower()

        if email in existing_emails:
            duplicates_found.append(contact)
            logger.warning(f"DUPLICATE FOUND: {contact['Email']} already exists")
        else:
            new_contacts_added.append(contact)
            logger.info(f"NEW CONTACT: {contact['Email']} - {contact['Business_Name']}")

    # Create consolidated file
    total_contacts = existing_contacts + new_contacts_added

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', f'HEALER_CONTACTS_CONSOLIDATED_{len(total_contacts)}_{timestamp}.csv')

    logger.info(f"Creating consolidated file with {len(total_contacts)} total contacts...")

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['ID', 'Business_Name', 'Email', 'Website']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        # Write existing contacts (maintaining original IDs)
        for contact in existing_contacts:
            writer.writerow({
                'ID': contact['ID'],
                'Business_Name': contact['Business_Name'],
                'Email': contact['Email'],
                'Website': contact['Website']
            })

        # Write new social media contacts with sequential IDs
        for i, contact in enumerate(new_contacts_added, len(existing_contacts) + 1):
            writer.writerow({
                'ID': f"HC_{i:03d}",
                'Business_Name': contact['Business_Name'],
                'Email': contact['Email'],
                'Website': contact['Website']
            })

    # Generate summary report
    logger.info("=" * 60)
    logger.info(f"CONSOLIDATION COMPLETE!")
    logger.info(f"Existing contacts: {len(existing_contacts)}")
    logger.info(f"New contacts added: {len(new_contacts_added)}")
    logger.info(f"Duplicates found: {len(duplicates_found)}")
    logger.info(f"Total consolidated contacts: {len(total_contacts)}")
    logger.info(f"Consolidated file: {output_file}")
    logger.info("=" * 60)

    if new_contacts_added:
        logger.info("NEW SOCIAL MEDIA CONTACTS ADDED:")
        for i, contact in enumerate(new_contacts_added, 1):
            logger.info(f"{i}. {contact['Business_Name']}")
            logger.info(f"   Email: {contact['Email']}")
            logger.info(f"   Website: {contact['Website']}")
            logger.info("")

    if duplicates_found:
        logger.info("DUPLICATE CONTACTS (not added):")
        for contact in duplicates_found:
            logger.info(f"- {contact['Email']} - {contact['Business_Name']}")

    return output_file, len(total_contacts), len(new_contacts_added)

def main():
    print("CONSOLIDATE SOCIAL MEDIA HEALERS")
    print("=" * 40)
    print("Merging new social media contacts with existing healer database...")
    print("")

    try:
        output_file, total_count, new_count = consolidate_healer_contacts()
        print(f"SUCCESS: Consolidation completed!")
        print(f"Total healer contacts: {total_count}")
        print(f"New contacts added: {new_count}")
        print(f"Consolidated file: {output_file}")

    except Exception as e:
        print(f"ERROR: {e}")
        logger.error(f"Consolidation error: {e}", exc_info=True)

if __name__ == "__main__":
    main()