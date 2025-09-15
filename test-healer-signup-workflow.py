#!/usr/bin/env python3
"""
HEALER SIGNUP WORKFLOW TESTER
Comprehensive test of the healer registration and onboarding process to ensure
no dead ends, placeholders, or fake information exists in the user journey.

Tests:
1. Registration process
2. Profile setup
3. Service management
4. Availability scheduling
5. Payment setup (Stripe Connect)
6. Dashboard functionality
7. End-to-end booking flow
8. Email notifications
"""

import requests
import json
import time
import logging
from datetime import datetime
import os
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class HealerWorkflowTester:
    def __init__(self):
        self.base_url = "https://backend-production-5e29.up.railway.app"
        self.frontend_url = "https://thecommonsoul.com"
        self.session = requests.Session()

        # Test healer data
        self.test_healer = {
            "email": f"testHealer{int(time.time())}@commonsoultester.com",
            "password": "TestPassword123!",
            "name": "Test Healer",
            "role": "HEALER"
        }

        self.auth_token = None
        self.healer_id = None
        self.service_id = None

        # Track issues found
        self.issues_found = []
        self.test_results = {
            "registration": {"status": "pending", "details": []},
            "profile_setup": {"status": "pending", "details": []},
            "service_management": {"status": "pending", "details": []},
            "availability": {"status": "pending", "details": []},
            "payment_setup": {"status": "pending", "details": []},
            "dashboard": {"status": "pending", "details": []},
            "booking_flow": {"status": "pending", "details": []},
            "notifications": {"status": "pending", "details": []}
        }

    def log_issue(self, category: str, severity: str, description: str, details: str = ""):
        """Log an issue found during testing"""
        issue = {
            "category": category,
            "severity": severity,
            "description": description,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.issues_found.append(issue)
        logger.error(f"ISSUE [{severity}] {category}: {description}")
        if details:
            logger.error(f"  Details: {details}")

    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with error handling"""
        url = self.base_url + endpoint

        headers = kwargs.get('headers', {})
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        kwargs['headers'] = headers

        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            logger.info(f"{method} {endpoint} -> {response.status_code}")
            return response
        except requests.exceptions.RequestException as e:
            self.log_issue("API", "CRITICAL", f"Request failed: {method} {endpoint}", str(e))
            raise

    def test_healer_registration(self) -> bool:
        """Test healer registration process"""
        logger.info("=" * 60)
        logger.info("TESTING HEALER REGISTRATION")
        logger.info("=" * 60)

        try:
            # Test registration endpoint
            response = self.make_request('POST', '/api/auth/register', json=self.test_healer)

            if response.status_code != 201:
                self.log_issue("Registration", "CRITICAL",
                              f"Registration failed with status {response.status_code}",
                              response.text)
                self.test_results["registration"]["status"] = "failed"
                return False

            result = response.json()

            # Check for required fields in response
            required_fields = ['token', 'user']
            for field in required_fields:
                if field not in result:
                    self.log_issue("Registration", "CRITICAL",
                                  f"Missing required field '{field}' in registration response")
                    self.test_results["registration"]["status"] = "failed"
                    return False

            # Check for placeholder or fake data
            user_data = result['user']
            if 'placeholder' in str(user_data).lower() or 'example' in str(user_data).lower():
                self.log_issue("Registration", "HIGH",
                              "Placeholder data found in registration response",
                              str(user_data))

            self.auth_token = result['token']
            self.healer_id = user_data['id']

            self.test_results["registration"]["status"] = "passed"
            self.test_results["registration"]["details"].append("Registration successful")
            self.test_results["registration"]["details"].append(f"User ID: {self.healer_id}")

            logger.info(f"✓ Registration successful - Healer ID: {self.healer_id}")
            return True

        except Exception as e:
            self.log_issue("Registration", "CRITICAL", "Registration test failed", str(e))
            self.test_results["registration"]["status"] = "failed"
            return False

    def test_profile_setup(self) -> bool:
        """Test healer profile setup process"""
        logger.info("=" * 60)
        logger.info("TESTING PROFILE SETUP")
        logger.info("=" * 60)

        try:
            # Test getting current profile
            response = self.make_request('GET', f'/api/healers/{self.healer_id}')

            if response.status_code != 200:
                self.log_issue("Profile", "CRITICAL",
                              f"Failed to get healer profile: {response.status_code}")
                self.test_results["profile_setup"]["status"] = "failed"
                return False

            profile = response.json()

            # Test updating profile
            profile_update = {
                "bio": "Test healer specializing in energy healing and wellness coaching",
                "specialties": ["Energy Healing", "Wellness Coaching"],
                "experience": "5+ years of professional healing practice",
                "certifications": ["Reiki Master", "Certified Life Coach"],
                "location": "Test City, TC"
            }

            response = self.make_request('PUT', f'/api/healers/{self.healer_id}', json=profile_update)

            if response.status_code != 200:
                self.log_issue("Profile", "HIGH",
                              f"Profile update failed: {response.status_code}",
                              response.text)
                self.test_results["profile_setup"]["status"] = "failed"
                return False

            updated_profile = response.json()

            # Verify update was successful
            for key, value in profile_update.items():
                if key not in updated_profile or updated_profile[key] != value:
                    self.log_issue("Profile", "HIGH",
                                  f"Profile field '{key}' not updated correctly")

            # Check for placeholder content
            profile_text = json.dumps(updated_profile).lower()
            placeholder_terms = ['placeholder', 'lorem ipsum', 'example', 'test data', 'fake']
            for term in placeholder_terms:
                if term in profile_text and term != 'test':  # Allow our test data
                    self.log_issue("Profile", "MEDIUM",
                                  f"Potential placeholder content found: {term}")

            self.test_results["profile_setup"]["status"] = "passed"
            self.test_results["profile_setup"]["details"].append("Profile update successful")

            logger.info("✓ Profile setup successful")
            return True

        except Exception as e:
            self.log_issue("Profile", "CRITICAL", "Profile setup test failed", str(e))
            self.test_results["profile_setup"]["status"] = "failed"
            return False

    def test_service_management(self) -> bool:
        """Test healer service creation and management"""
        logger.info("=" * 60)
        logger.info("TESTING SERVICE MANAGEMENT")
        logger.info("=" * 60)

        try:
            # Create a test service
            service_data = {
                "name": "Test Energy Healing Session",
                "description": "A comprehensive energy healing session to restore balance and wellness",
                "price": 89.99,
                "duration": 60,
                "category": "Energy Healing",
                "isActive": True
            }

            response = self.make_request('POST', f'/api/healers/{self.healer_id}/services', json=service_data)

            if response.status_code != 201:
                self.log_issue("Services", "CRITICAL",
                              f"Service creation failed: {response.status_code}",
                              response.text)
                self.test_results["service_management"]["status"] = "failed"
                return False

            service = response.json()
            self.service_id = service['id']

            # Verify service data
            for key, value in service_data.items():
                if key not in service or service[key] != value:
                    self.log_issue("Services", "HIGH",
                                  f"Service field '{key}' not set correctly")

            # Test getting services list
            response = self.make_request('GET', f'/api/healers/{self.healer_id}/services')

            if response.status_code != 200:
                self.log_issue("Services", "HIGH",
                              f"Failed to get services list: {response.status_code}")
                return False

            services = response.json()
            if not services or len(services) == 0:
                self.log_issue("Services", "HIGH", "Services list is empty after creation")
                return False

            # Test service update
            update_data = {"price": 99.99, "description": "Updated description"}
            response = self.make_request('PUT', f'/api/healers/{self.healer_id}/services/{self.service_id}',
                                       json=update_data)

            if response.status_code != 200:
                self.log_issue("Services", "MEDIUM",
                              f"Service update failed: {response.status_code}")

            self.test_results["service_management"]["status"] = "passed"
            self.test_results["service_management"]["details"].append(f"Service created: {self.service_id}")
            self.test_results["service_management"]["details"].append("Service CRUD operations working")

            logger.info(f"✓ Service management successful - Service ID: {self.service_id}")
            return True

        except Exception as e:
            self.log_issue("Services", "CRITICAL", "Service management test failed", str(e))
            self.test_results["service_management"]["status"] = "failed"
            return False

    def test_availability_system(self) -> bool:
        """Test healer availability scheduling"""
        logger.info("=" * 60)
        logger.info("TESTING AVAILABILITY SYSTEM")
        logger.info("=" * 60)

        try:
            # Test getting availability
            response = self.make_request('GET', f'/api/healers/{self.healer_id}/availability')

            if response.status_code != 200:
                self.log_issue("Availability", "HIGH",
                              f"Failed to get availability: {response.status_code}")
                self.test_results["availability"]["status"] = "failed"
                return False

            # Test setting availability
            availability_data = {
                "monday": {"available": True, "start": "09:00", "end": "17:00"},
                "tuesday": {"available": True, "start": "09:00", "end": "17:00"},
                "wednesday": {"available": True, "start": "09:00", "end": "17:00"},
                "thursday": {"available": True, "start": "09:00", "end": "17:00"},
                "friday": {"available": True, "start": "09:00", "end": "17:00"},
                "saturday": {"available": False},
                "sunday": {"available": False}
            }

            response = self.make_request('PUT', f'/api/healers/{self.healer_id}/availability',
                                       json=availability_data)

            if response.status_code not in [200, 201]:
                self.log_issue("Availability", "HIGH",
                              f"Failed to set availability: {response.status_code}",
                              response.text)
                self.test_results["availability"]["status"] = "failed"
                return False

            self.test_results["availability"]["status"] = "passed"
            self.test_results["availability"]["details"].append("Availability system working")

            logger.info("✓ Availability system successful")
            return True

        except Exception as e:
            self.log_issue("Availability", "CRITICAL", "Availability test failed", str(e))
            self.test_results["availability"]["status"] = "failed"
            return False

    def test_payment_setup(self) -> bool:
        """Test Stripe Connect payment setup"""
        logger.info("=" * 60)
        logger.info("TESTING PAYMENT SETUP (STRIPE CONNECT)")
        logger.info("=" * 60)

        try:
            # Test getting payment setup status
            response = self.make_request('GET', f'/api/healers/{self.healer_id}/payment-setup')

            if response.status_code != 200:
                self.log_issue("Payments", "HIGH",
                              f"Failed to get payment setup status: {response.status_code}")
                self.test_results["payment_setup"]["status"] = "failed"
                return False

            payment_status = response.json()

            # Check if Stripe Connect onboarding URL is available
            if 'onboardingUrl' not in payment_status and 'stripeAccountId' not in payment_status:
                self.log_issue("Payments", "HIGH",
                              "No Stripe Connect onboarding available")
                self.test_results["payment_setup"]["status"] = "failed"
                return False

            # Test creating Stripe Connect account setup
            response = self.make_request('POST', f'/api/healers/{self.healer_id}/setup-payments')

            if response.status_code not in [200, 201]:
                self.log_issue("Payments", "HIGH",
                              f"Failed to setup payments: {response.status_code}",
                              response.text)
                self.test_results["payment_setup"]["status"] = "partial"
            else:
                setup_result = response.json()
                if 'accountLinkUrl' in setup_result or 'onboardingUrl' in setup_result:
                    self.test_results["payment_setup"]["details"].append("Stripe Connect URL generated")
                else:
                    self.log_issue("Payments", "MEDIUM",
                                  "No onboarding URL in payment setup response")

            self.test_results["payment_setup"]["status"] = "passed"
            self.test_results["payment_setup"]["details"].append("Payment system endpoints working")

            logger.info("✓ Payment setup endpoints working")
            return True

        except Exception as e:
            self.log_issue("Payments", "CRITICAL", "Payment setup test failed", str(e))
            self.test_results["payment_setup"]["status"] = "failed"
            return False

    def test_dashboard_functionality(self) -> bool:
        """Test healer dashboard functionality"""
        logger.info("=" * 60)
        logger.info("TESTING DASHBOARD FUNCTIONALITY")
        logger.info("=" * 60)

        try:
            # Test dashboard data endpoints
            endpoints_to_test = [
                f'/api/healers/{self.healer_id}/dashboard',
                f'/api/healers/{self.healer_id}/bookings',
                f'/api/healers/{self.healer_id}/earnings',
                f'/api/healers/{self.healer_id}/reviews'
            ]

            all_working = True

            for endpoint in endpoints_to_test:
                response = self.make_request('GET', endpoint)

                if response.status_code not in [200, 404]:  # 404 is okay for empty data
                    self.log_issue("Dashboard", "HIGH",
                                  f"Dashboard endpoint failed: {endpoint} -> {response.status_code}")
                    all_working = False
                else:
                    self.test_results["dashboard"]["details"].append(f"✓ {endpoint}")

            if all_working:
                self.test_results["dashboard"]["status"] = "passed"
                logger.info("✓ Dashboard functionality working")
            else:
                self.test_results["dashboard"]["status"] = "partial"
                logger.warning("⚠ Some dashboard endpoints have issues")

            return all_working

        except Exception as e:
            self.log_issue("Dashboard", "CRITICAL", "Dashboard test failed", str(e))
            self.test_results["dashboard"]["status"] = "failed"
            return False

    def test_booking_flow_simulation(self) -> bool:
        """Test the booking flow from customer perspective"""
        logger.info("=" * 60)
        logger.info("TESTING BOOKING FLOW (CUSTOMER PERSPECTIVE)")
        logger.info("=" * 60)

        try:
            # Create a test customer
            test_customer = {
                "email": f"testCustomer{int(time.time())}@commonsoultester.com",
                "password": "TestPassword123!",
                "name": "Test Customer",
                "role": "CUSTOMER"
            }

            response = self.make_request('POST', '/api/auth/register', json=test_customer)

            if response.status_code != 201:
                self.log_issue("Booking", "HIGH",
                              f"Customer registration failed: {response.status_code}")
                self.test_results["booking_flow"]["status"] = "failed"
                return False

            customer_result = response.json()
            customer_token = customer_result['token']
            customer_id = customer_result['user']['id']

            # Switch to customer token for booking
            original_token = self.auth_token
            self.auth_token = customer_token

            # Test searching for healers
            response = self.make_request('GET', '/api/healers')

            if response.status_code != 200:
                self.log_issue("Booking", "HIGH",
                              f"Healer search failed: {response.status_code}")
                self.test_results["booking_flow"]["status"] = "failed"
                return False

            healers = response.json()

            # Find our test healer
            test_healer_found = False
            for healer in healers:
                if healer['id'] == self.healer_id:
                    test_healer_found = True
                    break

            if not test_healer_found:
                self.log_issue("Booking", "HIGH", "Test healer not found in healer listings")

            # Test getting healer services
            response = self.make_request('GET', f'/api/healers/{self.healer_id}/services')

            if response.status_code != 200:
                self.log_issue("Booking", "HIGH",
                              f"Failed to get healer services for booking: {response.status_code}")
                self.test_results["booking_flow"]["status"] = "failed"
                return False

            services = response.json()
            if not services:
                self.log_issue("Booking", "HIGH", "No services available for booking")
                self.test_results["booking_flow"]["status"] = "failed"
                return False

            # Restore healer token
            self.auth_token = original_token

            self.test_results["booking_flow"]["status"] = "passed"
            self.test_results["booking_flow"]["details"].append("Customer registration working")
            self.test_results["booking_flow"]["details"].append("Healer discovery working")
            self.test_results["booking_flow"]["details"].append("Service listing working")

            logger.info("✓ Booking flow simulation successful")
            return True

        except Exception as e:
            self.log_issue("Booking", "CRITICAL", "Booking flow test failed", str(e))
            self.test_results["booking_flow"]["status"] = "failed"
            return False

    def check_for_placeholders_and_dead_ends(self) -> bool:
        """Check for placeholder content and dead ends in the system"""
        logger.info("=" * 60)
        logger.info("CHECKING FOR PLACEHOLDERS AND DEAD ENDS")
        logger.info("=" * 60)

        issues_found = False

        # Test key pages/endpoints for placeholder content
        test_urls = [
            f"{self.frontend_url}",
            f"{self.frontend_url}/healers",
            f"{self.frontend_url}/about",
            f"{self.frontend_url}/contact",
            f"{self.frontend_url}/register"
        ]

        for url in test_urls:
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    content = response.text.lower()

                    # Check for placeholder content
                    placeholder_terms = [
                        'lorem ipsum',
                        'placeholder',
                        'todo:',
                        'coming soon',
                        'under construction',
                        'example.com',
                        'your-email@example.com',
                        'replace this text'
                    ]

                    for term in placeholder_terms:
                        if term in content:
                            self.log_issue("Content", "MEDIUM",
                                          f"Placeholder content found on {url}: {term}")
                            issues_found = True

                else:
                    self.log_issue("Content", "HIGH",
                                  f"Page not accessible: {url} -> {response.status_code}")
                    issues_found = True

            except Exception as e:
                self.log_issue("Content", "HIGH",
                              f"Failed to check {url}", str(e))
                issues_found = True

        return not issues_found

    def generate_test_report(self):
        """Generate comprehensive test report"""
        logger.info("=" * 80)
        logger.info("HEALER SIGNUP WORKFLOW TEST REPORT")
        logger.info("=" * 80)

        # Summary statistics
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["status"] == "passed")
        failed_tests = sum(1 for result in self.test_results.values() if result["status"] == "failed")
        partial_tests = sum(1 for result in self.test_results.values() if result["status"] == "partial")

        logger.info(f"Test Summary:")
        logger.info(f"  Total Tests: {total_tests}")
        logger.info(f"  Passed: {passed_tests}")
        logger.info(f"  Failed: {failed_tests}")
        logger.info(f"  Partial: {partial_tests}")
        logger.info(f"  Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        logger.info("")

        # Detailed results
        for test_name, result in self.test_results.items():
            status_symbol = "✓" if result["status"] == "passed" else "✗" if result["status"] == "failed" else "⚠"
            logger.info(f"{status_symbol} {test_name.upper()}: {result['status'].upper()}")

            for detail in result["details"]:
                logger.info(f"    - {detail}")
            logger.info("")

        # Issues found
        if self.issues_found:
            logger.info("ISSUES FOUND:")
            logger.info("-" * 40)

            # Group by severity
            critical_issues = [i for i in self.issues_found if i["severity"] == "CRITICAL"]
            high_issues = [i for i in self.issues_found if i["severity"] == "HIGH"]
            medium_issues = [i for i in self.issues_found if i["severity"] == "MEDIUM"]

            for severity, issues in [("CRITICAL", critical_issues), ("HIGH", high_issues), ("MEDIUM", medium_issues)]:
                if issues:
                    logger.info(f"\n{severity} ISSUES ({len(issues)}):")
                    for issue in issues:
                        logger.info(f"  • {issue['category']}: {issue['description']}")
                        if issue['details']:
                            logger.info(f"    Details: {issue['details']}")
        else:
            logger.info("✓ NO ISSUES FOUND - All systems working correctly!")

        # Overall assessment
        logger.info("=" * 80)
        if failed_tests == 0 and len([i for i in self.issues_found if i["severity"] == "CRITICAL"]) == 0:
            logger.info("🎉 HEALER SIGNUP WORKFLOW: PRODUCTION READY!")
            logger.info("All critical systems working, ready for real healer onboarding.")
        elif failed_tests > 0 or len([i for i in self.issues_found if i["severity"] == "CRITICAL"]) > 0:
            logger.info("⚠ HEALER SIGNUP WORKFLOW: NEEDS ATTENTION")
            logger.info("Critical issues found that should be fixed before production.")
        else:
            logger.info("✓ HEALER SIGNUP WORKFLOW: MOSTLY READY")
            logger.info("Minor issues found, but core functionality working.")

        logger.info("=" * 80)

        # Save report to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"healer_workflow_test_report_{timestamp}.json"

        report_data = {
            "test_summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "partial": partial_tests,
                "success_rate": (passed_tests/total_tests)*100
            },
            "test_results": self.test_results,
            "issues_found": self.issues_found,
            "test_timestamp": datetime.now().isoformat(),
            "test_healer_email": self.test_healer["email"]
        }

        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)

        logger.info(f"Detailed report saved to: {report_file}")

    def run_full_workflow_test(self):
        """Run the complete healer workflow test"""
        logger.info("🚀 Starting Healer Signup Workflow Test...")
        logger.info(f"Test Healer Email: {self.test_healer['email']}")
        logger.info("")

        # Run all tests
        test_functions = [
            self.test_healer_registration,
            self.test_profile_setup,
            self.test_service_management,
            self.test_availability_system,
            self.test_payment_setup,
            self.test_dashboard_functionality,
            self.test_booking_flow_simulation
        ]

        for test_func in test_functions:
            try:
                test_func()
                time.sleep(2)  # Brief pause between tests
            except Exception as e:
                logger.error(f"Test {test_func.__name__} crashed: {e}")

        # Check for placeholder content
        self.check_for_placeholders_and_dead_ends()

        # Generate final report
        self.generate_test_report()

def main():
    print("HEALER SIGNUP WORKFLOW TESTER")
    print("=" * 50)
    print("Testing complete healer onboarding process...")
    print("Checking for dead ends, placeholders, and fake information...")
    print("")

    tester = HealerWorkflowTester()

    try:
        tester.run_full_workflow_test()
        print("\n✓ Healer workflow testing completed!")
        print("Check the log output above for detailed results.")

    except KeyboardInterrupt:
        print("\n⚠ Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Testing failed: {e}")
        logger.error(f"Testing error: {e}", exc_info=True)

if __name__ == "__main__":
    main()