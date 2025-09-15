#!/usr/bin/env python3
"""
QUALITY REVIEW FOR SOCIAL MEDIA CONTACTS
Clean and validate the discovered social media contacts, removing synthetic data
"""

import csv
import os
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def quality_review_contacts():
    """Review and clean the discovered social media contacts"""

    input_file = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'proven_direct_healers_20250914_014659.csv')

    # Read the discovered contacts
    contacts = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            contacts.append(row)

    logger.info(f"Reviewing {len(contacts)} discovered contacts...")

    # Quality review each contact
    valid_contacts = []
    removed_contacts = []

    for contact in contacts:
        email = contact['Email'].lower()
        business_name = contact['Business_Name'].lower()
        website = contact['Website']

        # Check for synthetic/invalid emails
        is_synthetic = False
        synthetic_indicators = [
            '555-555-5555',  # Fake phone number in email
            'yahoo.complease',  # Malformed email
            'mailservice.com',  # Generic test domain
            'example.com',
            'test.com',
            'placeholder',
            'noreply'
        ]

        for indicator in synthetic_indicators:
            if indicator in email:
                is_synthetic = True
                logger.warning(f"REMOVING SYNTHETIC: {email} - contains '{indicator}'")
                break

        # Check for non-healing businesses
        non_healing_indicators = [
            'car accident',
            'luxury beach rental',
            'cape cod cottage',
            'auto accident',
            'chiropractor houston'  # This is medical but not holistic healing
        ]

        is_non_healing = False
        for indicator in non_healing_indicators:
            if indicator in business_name:
                is_non_healing = True
                logger.warning(f"REMOVING NON-HEALING: {contact['Business_Name']} - contains '{indicator}'")
                break

        # Keep only legitimate healing contacts
        if not is_synthetic and not is_non_healing:
            valid_contacts.append(contact)
            logger.info(f"✓ KEEPING: {contact['Email']} - {contact['Business_Name']}")
        else:
            removed_contacts.append(contact)

    # Create cleaned file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', f'cleaned_social_healers_{timestamp}.csv')

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['ID', 'Business_Name', 'Email', 'Website', 'Platform']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i, contact in enumerate(valid_contacts, 1):
            writer.writerow({
                'ID': f"CS_{i:03d}",  # CS = Cleaned Social
                'Business_Name': contact['Business_Name'],
                'Email': contact['Email'],
                'Website': contact['Website'],
                'Platform': contact['Platform']
            })

    logger.info("=" * 60)
    logger.info(f"QUALITY REVIEW COMPLETE")
    logger.info(f"Original contacts: {len(contacts)}")
    logger.info(f"Valid contacts: {len(valid_contacts)}")
    logger.info(f"Removed contacts: {len(removed_contacts)}")
    logger.info(f"Cleaned file saved to: {output_file}")
    logger.info("=" * 60)

    # Display valid contacts
    if valid_contacts:
        logger.info("VALID HEALER CONTACTS:")
        for i, contact in enumerate(valid_contacts, 1):
            logger.info(f"{i}. {contact['Business_Name']}")
            logger.info(f"   Email: {contact['Email']}")
            logger.info(f"   Website: {contact['Website']}")
            logger.info("")

    # Display removed contacts
    if removed_contacts:
        logger.info("REMOVED CONTACTS (synthetic/non-healing):")
        for contact in removed_contacts:
            logger.info(f"✗ {contact['Email']} - {contact['Business_Name']}")

    return output_file, len(valid_contacts)

def main():
    print("QUALITY REVIEW FOR SOCIAL MEDIA CONTACTS")
    print("=" * 50)
    print("Cleaning discovered contacts, removing synthetic data...")
    print("")

    try:
        output_file, count = quality_review_contacts()
        print(f"✓ Quality review completed!")
        print(f"✓ {count} valid healer contacts found")
        print(f"✓ Cleaned results saved to: {output_file}")

    except Exception as e:
        print(f"❌ Error during quality review: {e}")
        logger.error(f"Quality review error: {e}", exc_info=True)

if __name__ == "__main__":
    main()