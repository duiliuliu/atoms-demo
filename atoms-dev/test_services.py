#!/usr/bin/env python3
"""
Atoms.dev - Service Verification Script
Tests both frontend and backend services
"""

import urllib.request
import urllib.error
import json
import sys

def test_endpoint(url, name, expected_status=200):
    """Test an HTTP endpoint"""
    try:
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req, timeout=5)
        status = response.getcode()
        
        if status == expected_status:
            print(f"  ✓ {name}: {status} OK")
            return True
        else:
            print(f"  ✗ {name}: Expected {expected_status}, got {status}")
            return False
    except urllib.error.URLError as e:
        print(f"  ✗ {name}: {str(e)}")
        return False
    except Exception as e:
        print(f"  ✗ {name}: {str(e)}")
        return False

def main():
    results = {
        'passed': [],
        'failed': []
    }
    
    print("=" * 60)
    print("Atoms.dev Service Verification")
    print("=" * 60)
    
    # Test Backend Services
    print("\n📦 Backend Services (Port 3001)")
    print("-" * 40)
    
    if test_endpoint("http://localhost:3001/health", "Health Check"):
        results['passed'].append("Backend health check")
    else:
        results['failed'].append("Backend health check")
    
    # Test Frontend Services
    print("\n🎨 Frontend Services (Port 5173)")
    print("-" * 40)
    
    if test_endpoint("http://localhost:5173", "Frontend Root"):
        results['passed'].append("Frontend root")
    else:
        results['failed'].append("Frontend root")
    
    if test_endpoint("http://localhost:5173/src/main.tsx", "Main Script"):
        results['passed'].append("Main script")
    else:
        results['failed'].append("Main script")
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    
    print(f"\n✅ Passed: {len(results['passed'])}")
    for test in results['passed']:
        print(f"  ✓ {test}")
    
    if results['failed']:
        print(f"\n❌ Failed: {len(results['failed'])}")
        for test in results['failed']:
            print(f"  ✗ {test}")
    
    print("\n" + "=" * 60)
    
    if results['failed']:
        print(f"❌ {len(results['failed'])} test(s) failed")
        return 1
    else:
        print("✅ All services are running correctly!")
        return 0

if __name__ == '__main__':
    sys.exit(main())
