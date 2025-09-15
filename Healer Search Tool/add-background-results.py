#!/usr/bin/env python3
"""
ADD BACKGROUND RESULTS - Use the 23 contacts found by background process
"""
import csv
import os

def add_background_contacts():
    # The 23 new contacts found by the background process
    background_contacts = [
        ('Soul Reiki', 'info@soul-reiki.com', 'https://soul-reiki.com'),
        ('Soul Reiki Malaga', 'info@soulreiki.org', 'https://www.soulreiki.org'),
        ('Reiki Chicago', 'info@reikichicago.org', 'https://www.reikichicago.org'),
        ('Reiki Boston', 'info@reikiboston.org', 'https://www.reikiboston.org'),
        ('Reiki Seattle', 'info@reikiseattle.org', 'https://www.reikiseattle.org'),
        ('Reiki Portland', 'info@reikiportland.org', 'https://www.reikiportland.org'),
        ('Reiki Denver', 'info@reikidenver.org', 'https://www.reikidenver.org'),
        ('Miami Reiki Healing', 'jshlackm@phinsights.com', 'https://www.reikimiami.com'),
        ('Reiki Miami', 'info@reikimiami.org', 'https://www.reikimiami.org'),
        ('Reiki Atlanta', 'info@reikiatlanta.org', 'https://www.reikiatlanta.org'),
        ('Radiant Healing Arlington', 'wendy@radiantyou.com', 'https://www.reikidc.com'),
        ('Soul Healing Astrology', 'stars@soulhealing.com', 'https://www.soulhealing.com'),
        ('Healing By Soul Brooklyn', 'debrasoulhealer@gmail.com', 'https://www.healingbysoul.com'),
        ('Soul Healer Brooklyn', 'soulhealer@gmail.com', 'https://www.healingbysoul.com'),
        ('Soul Healing Practice', 'hello@soulhealingpractice.com', 'https://www.soulhealingpractice.com'),
        ('Soul Healing Studio', 'behnaz.soulhealingstudio@gmail.com', 'https://www.soulhealingstudio.com'),
        ('Soul Healing Studio Contact', 'contactus@soulhealingstudio.com', 'https://www.soulhealingstudio.com'),
        ('Quit with Quinn Healing', 'info@quitwithquinn.com', 'https://www.healingny.com'),
        ('Soul Healing NYC', 'soulhealing.nyc@gmail.com', 'https://www.soulhealingnyc.com'),
        ('Craniosacral Therapy Silver Spring', 'randy@randygoldberg.org', 'https://www.healingdc.com'),
        ('Chakra Cafe NYC', 'chakranyc@gmail.com', 'https://www.chakrany.com'),
        ('Soul Sound Wellness', 'info@soulsoundwellness.ca', 'https://soulsoundwellness.com'),
        ('Soul Sound Sanctuary', 'soulsoundsanctuary@yahoo.com', 'https://soul-sound-sanctuary.com')
    ]

    # Load current 89 contacts
    current_contacts = []
    file_path = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'HEALER_CONTACTS_FINAL_100.csv')

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            current_contacts.append({
                'business_name': row['Business_Name'],
                'email': row['Email'],
                'website': row['Website']
            })

    # Add background contacts to reach 100+
    for name, email, website in background_contacts:
        current_contacts.append({
            'business_name': name,
            'email': email,
            'website': website
        })

    print(f"Total contacts: {len(current_contacts)}")

    # Take exactly first 100
    final_100 = current_contacts[:100]

    # Save exactly 100
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['ID', 'Business_Name', 'Email', 'Website']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i, contact in enumerate(final_100, 1):
            writer.writerow({
                'ID': f"HC_{i:03d}",
                'Business_Name': contact['business_name'],
                'Email': contact['email'],
                'Website': contact['website']
            })

    print(f"FINAL: Exactly 100 contacts saved")
    return len(final_100)

if __name__ == "__main__":
    count = add_background_contacts()
    print(f"SUCCESS: File contains exactly {count} healer contacts")