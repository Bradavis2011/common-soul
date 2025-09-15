#!/usr/bin/env python3
"""
SIMPLE FINAL HEALER WORKFLOW TEST
Final validation without Unicode characters
"""

import requests
import time
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_healer_workflow():
    """Quick test of critical healer workflow components"""
    base_url = "https://backend-production-5e29.up.railway.app"
    results = []

    # Test data
    test_healer = {
        "email": f"quickTest{int(time.time())}@commonsoultester.com",
        "password": "TestPassword123!",
        "userType": "HEALER",
        "firstName": "Quick",
        "lastName": "Test"
    }

    logger.info("TESTING HEALER WORKFLOW - CRITICAL COMPONENTS")
    logger.info("=" * 60)

    try:
        # Test 1: Healer Registration
        logger.info("1. Testing Healer Registration...")
        response = requests.post(f"{base_url}/api/auth/register", json=test_healer, timeout=15)

        if response.status_code == 201:
            result = response.json()
            token = result['token']
            healer_id = result['user']['id']
            logger.info("   SUCCESS: Healer registration working")
            results.append("PASS: Healer Registration")
        else:
            logger.error(f"   FAILED: Registration failed with {response.status_code}")
            results.append("FAIL: Healer Registration")
            token = None
            healer_id = None

        time.sleep(1)

        # Test 2: Healer Discovery
        logger.info("2. Testing Healer Discovery...")
        response = requests.get(f"{base_url}/api/healers", timeout=15)

        if response.status_code == 200:
            healers = response.json()
            logger.info(f"   SUCCESS: Found {len(healers)} healers")
            results.append("PASS: Healer Discovery")
        else:
            logger.error(f"   FAILED: Healer discovery failed with {response.status_code}")
            results.append("FAIL: Healer Discovery")

        time.sleep(1)

        # Test 3: Services System
        logger.info("3. Testing Services System...")
        response = requests.get(f"{base_url}/api/services", timeout=15)

        if response.status_code == 200:
            services = response.json()
            logger.info(f"   SUCCESS: Found {len(services)} services")
            results.append("PASS: Services System")
        else:
            logger.error(f"   FAILED: Services system failed with {response.status_code}")
            results.append("FAIL: Services System")

        time.sleep(1)

        # Test 4: Payments System (FIXED)
        logger.info("4. Testing Payments System (Fixed)...")
        response = requests.get(f"{base_url}/api/payments", timeout=15)

        if response.status_code == 200:
            payment_info = response.json()
            logger.info(f"   SUCCESS: Payments system operational")
            logger.info(f"   Status: {payment_info.get('status', 'Unknown')}")
            results.append("PASS: Payments System")
        else:
            logger.error(f"   FAILED: Payments system failed with {response.status_code}")
            results.append("FAIL: Payments System")

        time.sleep(1)

        # Test 5: Availability System
        logger.info("5. Testing Availability System...")
        response = requests.get(f"{base_url}/api/availability", timeout=15)

        if response.status_code in [200, 401, 403]:  # All acceptable
            logger.info("   SUCCESS: Availability system accessible")
            results.append("PASS: Availability System")
        else:
            logger.error(f"   FAILED: Availability system failed with {response.status_code}")
            results.append("FAIL: Availability System")

        time.sleep(1)

        # Test 6: Customer Registration
        logger.info("6. Testing Customer Registration...")
        test_customer = {
            "email": f"quickCustomer{int(time.time())}@commonsoultester.com",
            "password": "TestPassword123!",
            "userType": "CUSTOMER",
            "firstName": "Quick",
            "lastName": "Customer"
        }

        response = requests.post(f"{base_url}/api/auth/register", json=test_customer, timeout=15)

        if response.status_code == 201:
            logger.info("   SUCCESS: Customer registration working")
            results.append("PASS: Customer Registration")
        else:
            logger.error(f"   FAILED: Customer registration failed with {response.status_code}")
            results.append("FAIL: Customer Registration")

    except Exception as e:
        logger.error(f"Test failed with exception: {e}")
        results.append(f"ERROR: {e}")

    # Calculate results
    passed = sum(1 for r in results if r.startswith("PASS"))
    failed = sum(1 for r in results if r.startswith("FAIL"))
    errors = sum(1 for r in results if r.startswith("ERROR"))

    total = passed + failed + errors
    success_rate = (passed / total * 100) if total > 0 else 0

    # Report
    logger.info("=" * 60)
    logger.info("FINAL TEST RESULTS")
    logger.info("=" * 60)
    logger.info(f"SUCCESS RATE: {success_rate:.1f}% ({passed}/{total})")
    logger.info("")
    logger.info("DETAILED RESULTS:")
    for result in results:
        logger.info(f"  {result}")

    logger.info("=" * 60)

    if success_rate >= 83:  # 5/6 or better
        logger.info("ASSESSMENT: EXCELLENT - Platform ready for production!")
        logger.info("Ready for healer onboarding with 102 discovered contacts")
    elif success_rate >= 67:  # 4/6 or better
        logger.info("ASSESSMENT: GOOD - Core functionality working")
        logger.info("Can proceed with limited healer onboarding")
    else:
        logger.info("ASSESSMENT: NEEDS WORK - Critical issues remain")
        logger.info("Should fix remaining issues before launch")

    return success_rate, results

def main():
    print("FINAL HEALER WORKFLOW VALIDATION")
    print("=" * 50)
    print("Testing all critical healer signup components...")
    print("")

    try:
        success_rate, results = test_healer_workflow()

        print(f"\nFINAL ASSESSMENT:")
        print(f"Success Rate: {success_rate:.1f}%")

        if success_rate >= 83:
            print("STATUS: READY FOR HEALER ONBOARDING!")
        elif success_rate >= 67:
            print("STATUS: MOSTLY READY - Minor fixes needed")
        else:
            print("STATUS: NEEDS MORE WORK - Address critical issues")

    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    main()