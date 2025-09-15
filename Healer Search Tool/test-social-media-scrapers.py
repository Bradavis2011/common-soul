#!/usr/bin/env python3
"""
SOCIAL MEDIA SCRAPER TEST RUNNER
Small-scale testing of LinkedIn and Instagram scrapers to validate functionality

Features:
- Small sample testing (1-2 results per platform)
- Validation of duplicate prevention
- CSV output verification
- Error handling testing
"""

import subprocess
import sys
import os
import csv
import logging
from datetime import datetime
import glob
from typing import Dict, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SocialMediaScrapersTestRunner:
    def __init__(self):
        self.test_results = {
            'linkedin': {'success': False, 'contacts_found': 0, 'file_path': None},
            'instagram': {'success': False, 'contacts_found': 0, 'file_path': None}
        }
        self.test_start_time = datetime.now()

    def count_existing_contacts(self):
        """Count existing contacts in the main database"""
        file_path = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'HEALER_CONTACTS_FINAL_100.csv')

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = sum(1 for row in reader)
            logger.info(f"Found {count} existing healer contacts in database")
            return count
        except FileNotFoundError:
            logger.warning("Main contacts file not found")
            return 0
        except Exception as e:
            logger.error(f"Error counting existing contacts: {e}")
            return 0

    def run_linkedin_test(self):
        """Run LinkedIn scraper with limited results for testing"""
        logger.info("Starting LinkedIn scraper test...")

        try:
            # Modify the LinkedIn scraper to run in test mode
            linkedin_script = os.path.join(os.path.dirname(__file__), 'linkedin-healer-scraper.py')

            # Create a test version with limited scope
            test_linkedin_script = os.path.join(os.path.dirname(__file__), 'test-linkedin-limited.py')

            # Copy and modify the LinkedIn scraper for testing
            with open(linkedin_script, 'r', encoding='utf-8') as f:
                script_content = f.read()

            # Modify for test mode - limit specialties and results
            test_script_content = script_content.replace(
                'self.healing_specialties[:10]',
                'self.healing_specialties[:2]'  # Only test 2 specialties
            ).replace(
                'max_results_per_specialty: int = 10',
                'max_results_per_specialty: int = 2'  # Only 2 results per specialty
            ).replace(
                'time.sleep(random.uniform(10, 15))',
                'time.sleep(2)'  # Faster for testing
            ).replace(
                'time.sleep(random.uniform(5, 10))',
                'time.sleep(1)'  # Faster for testing
            )

            with open(test_linkedin_script, 'w', encoding='utf-8') as f:
                f.write(test_script_content)

            # Run the test script
            logger.info("Executing LinkedIn test scraper...")
            result = subprocess.run([sys.executable, test_linkedin_script],
                                  capture_output=True, text=True, timeout=300)  # 5 minute timeout

            if result.returncode == 0:
                logger.info("LinkedIn test scraper completed successfully")

                # Find the output file
                output_files = glob.glob(os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'linkedin_healers_*.csv'))
                if output_files:
                    latest_file = max(output_files, key=os.path.getctime)

                    # Count contacts in the file
                    with open(latest_file, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        contact_count = sum(1 for row in reader)

                    self.test_results['linkedin']['success'] = True
                    self.test_results['linkedin']['contacts_found'] = contact_count
                    self.test_results['linkedin']['file_path'] = latest_file

                    logger.info(f"LinkedIn test: {contact_count} contacts found")
                else:
                    logger.warning("LinkedIn test: No output file found")

            else:
                logger.error(f"LinkedIn test failed with return code: {result.returncode}")
                logger.error(f"Error output: {result.stderr}")

            # Clean up test script
            try:
                os.remove(test_linkedin_script)
            except:
                pass

        except subprocess.TimeoutExpired:
            logger.error("LinkedIn test timed out after 5 minutes")
        except Exception as e:
            logger.error(f"Error running LinkedIn test: {e}")

    def run_instagram_test(self):
        """Run Instagram scraper with limited results for testing"""
        logger.info("Starting Instagram scraper test...")

        try:
            # Modify the Instagram scraper to run in test mode
            instagram_script = os.path.join(os.path.dirname(__file__), 'instagram-healer-scraper.py')

            # Create a test version with limited scope
            test_instagram_script = os.path.join(os.path.dirname(__file__), 'test-instagram-limited.py')

            # Copy and modify the Instagram scraper for testing
            with open(instagram_script, 'r', encoding='utf-8') as f:
                script_content = f.read()

            # Modify for test mode - limit hashtags and results
            test_script_content = script_content.replace(
                'self.healing_hashtags[:15]',
                'self.healing_hashtags[:3]'  # Only test 3 hashtags
            ).replace(
                'max_profiles_per_hashtag: int = 10',
                'max_profiles_per_hashtag: int = 2'  # Only 2 profiles per hashtag
            ).replace(
                'time.sleep(random.uniform(8, 12))',
                'time.sleep(2)'  # Faster for testing
            ).replace(
                'time.sleep(random.uniform(3, 6))',
                'time.sleep(1)'  # Faster for testing
            )

            with open(test_instagram_script, 'w', encoding='utf-8') as f:
                f.write(test_script_content)

            # Run the test script
            logger.info("Executing Instagram test scraper...")
            result = subprocess.run([sys.executable, test_instagram_script],
                                  capture_output=True, text=True, timeout=300)  # 5 minute timeout

            if result.returncode == 0:
                logger.info("Instagram test scraper completed successfully")

                # Find the output file
                output_files = glob.glob(os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'instagram_healers_*.csv'))
                if output_files:
                    latest_file = max(output_files, key=os.path.getctime)

                    # Count contacts in the file
                    with open(latest_file, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        contact_count = sum(1 for row in reader)

                    self.test_results['instagram']['success'] = True
                    self.test_results['instagram']['contacts_found'] = contact_count
                    self.test_results['instagram']['file_path'] = latest_file

                    logger.info(f"Instagram test: {contact_count} contacts found")
                else:
                    logger.warning("Instagram test: No output file found")

            else:
                logger.error(f"Instagram test failed with return code: {result.returncode}")
                logger.error(f"Error output: {result.stderr}")

            # Clean up test script
            try:
                os.remove(test_instagram_script)
            except:
                pass

        except subprocess.TimeoutExpired:
            logger.error("Instagram test timed out after 5 minutes")
        except Exception as e:
            logger.error(f"Error running Instagram test: {e}")

    def validate_csv_format(self, file_path: str, platform: str) -> bool:
        """Validate that the CSV file has the correct format"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)

                # Check required columns
                required_columns = ['ID', 'Business_Name', 'Email', 'Website', 'Platform']
                if not all(col in reader.fieldnames for col in required_columns):
                    logger.error(f"{platform} CSV missing required columns")
                    return False

                # Validate first few rows
                sample_rows = []
                for i, row in enumerate(reader):
                    if i >= 3:  # Only check first 3 rows
                        break
                    sample_rows.append(row)

                for row in sample_rows:
                    # Check ID format
                    if platform.lower() == 'linkedin' and not row['ID'].startswith('LI_'):
                        logger.error(f"{platform} CSV: Invalid ID format")
                        return False
                    elif platform.lower() == 'instagram' and not row['ID'].startswith('IG_'):
                        logger.error(f"{platform} CSV: Invalid ID format")
                        return False

                    # Check email format
                    if '@' not in row['Email']:
                        logger.error(f"{platform} CSV: Invalid email format")
                        return False

                    # Check platform field
                    if row['Platform'].lower() != platform.lower():
                        logger.error(f"{platform} CSV: Incorrect platform field")
                        return False

                logger.info(f"{platform} CSV format validation passed")
                return True

        except Exception as e:
            logger.error(f"Error validating {platform} CSV format: {e}")
            return False

    def check_for_duplicates(self, file_path: str, platform: str) -> Dict:
        """Check if the scraper properly avoided duplicates"""
        existing_file = os.path.join(os.path.dirname(__file__), 'Discovery Results', 'exports', 'HEALER_CONTACTS_FINAL_100.csv')

        try:
            # Load existing emails
            existing_emails = set()
            with open(existing_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing_emails.add(row['Email'].lower())

            # Check new file for duplicates
            duplicates_found = []
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['Email'].lower() in existing_emails:
                        duplicates_found.append(row['Email'])

            result = {
                'duplicates_count': len(duplicates_found),
                'duplicate_emails': duplicates_found
            }

            if duplicates_found:
                logger.warning(f"{platform}: {len(duplicates_found)} duplicates found: {duplicates_found}")
            else:
                logger.info(f"{platform}: No duplicates found - duplicate prevention working correctly")

            return result

        except Exception as e:
            logger.error(f"Error checking duplicates for {platform}: {e}")
            return {'duplicates_count': -1, 'duplicate_emails': []}

    def display_sample_results(self, file_path: str, platform: str):
        """Display sample results from the test"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)

                logger.info(f"Sample {platform} results:")
                for i, row in enumerate(reader):
                    if i >= 3:  # Show first 3 results
                        break
                    logger.info(f"  {i+1}. {row['Business_Name']}")
                    logger.info(f"     Email: {row['Email']}")
                    logger.info(f"     Website: {row['Website']}")
                    logger.info("")

        except Exception as e:
            logger.error(f"Error displaying {platform} sample results: {e}")

    def run_tests(self):
        """Run all social media scraper tests"""
        logger.info("=" * 60)
        logger.info("SOCIAL MEDIA SCRAPERS TEST RUNNER")
        logger.info("=" * 60)

        # Count existing contacts
        existing_count = self.count_existing_contacts()

        # Test LinkedIn scraper (highest priority)
        logger.info("\n" + "="*30 + " LINKEDIN TEST " + "="*30)
        self.run_linkedin_test()

        # Test Instagram scraper
        logger.info("\n" + "="*30 + " INSTAGRAM TEST " + "="*30)
        self.run_instagram_test()

        # Generate test report
        self.generate_test_report()

    def generate_test_report(self):
        """Generate a comprehensive test report"""
        logger.info("\n" + "="*60)
        logger.info("TEST RESULTS SUMMARY")
        logger.info("="*60)

        total_contacts = 0

        for platform, results in self.test_results.items():
            logger.info(f"\n{platform.upper()} SCRAPER:")
            logger.info(f"  Status: {'✓ SUCCESS' if results['success'] else '✗ FAILED'}")
            logger.info(f"  Contacts Found: {results['contacts_found']}")

            if results['success'] and results['file_path']:
                # Validate CSV format
                csv_valid = self.validate_csv_format(results['file_path'], platform)
                logger.info(f"  CSV Format: {'✓ VALID' if csv_valid else '✗ INVALID'}")

                # Check duplicates
                duplicate_check = self.check_for_duplicates(results['file_path'], platform)
                if duplicate_check['duplicates_count'] == 0:
                    logger.info(f"  Duplicate Prevention: ✓ WORKING")
                else:
                    logger.info(f"  Duplicate Prevention: ✗ {duplicate_check['duplicates_count']} DUPLICATES")

                # Display sample results
                if results['contacts_found'] > 0:
                    self.display_sample_results(results['file_path'], platform)

                total_contacts += results['contacts_found']

            logger.info(f"  Output File: {results['file_path'] or 'None'}")

        # Overall summary
        test_duration = datetime.now() - self.test_start_time
        logger.info(f"\n{'='*60}")
        logger.info(f"OVERALL TEST SUMMARY:")
        logger.info(f"  Total Duration: {test_duration}")
        logger.info(f"  Total New Contacts: {total_contacts}")
        logger.info(f"  Successful Platforms: {sum(1 for r in self.test_results.values() if r['success'])}/2")

        if total_contacts > 0:
            logger.info(f"✓ TESTS COMPLETED SUCCESSFULLY - Social media scrapers are functional!")
        else:
            logger.warning("⚠ TESTS COMPLETED - No contacts found (may need adjustment or different search terms)")

def main():
    print("SOCIAL MEDIA SCRAPERS TEST RUNNER")
    print("=" * 50)
    print("Running small-scale tests of LinkedIn and Instagram scrapers...")
    print("This will test functionality without doing full-scale searches.")
    print("")

    runner = SocialMediaScrapersTestRunner()

    try:
        runner.run_tests()
    except KeyboardInterrupt:
        print("\n⚠ Tests interrupted by user")
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        logger.error(f"Test error: {e}", exc_info=True)

if __name__ == "__main__":
    main()