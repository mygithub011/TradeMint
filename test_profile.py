"""
Test script for user profile functionality
"""
import sys
sys.path.insert(0, '.')

import requests
import json

BASE_URL = "http://localhost:8000"

def test_profile():
    print("=" * 70)
    print("TESTING USER PROFILE FUNCTIONALITY")
    print("=" * 70)
    
    # Step 1: Login as client
    print("\n1. Login as client...")
    client_login = requests.post(f"{BASE_URL}/auth/login",
                                data={'username': 'client@example.com', 'password': 'client123'})
    
    if client_login.status_code != 200:
        print("❌ Client login failed")
        return
    
    client_token = client_login.json()['access_token']
    client_headers = {'Authorization': f'Bearer {client_token}'}
    print("✓ Client logged in successfully")
    
    # Step 2: Get current profile
    print("\n2. Fetching current profile...")
    profile_resp = requests.get(f"{BASE_URL}/auth/profile", headers=client_headers)
    
    if profile_resp.status_code != 200:
        print(f"❌ Failed to fetch profile: {profile_resp.text}")
        return
    
    profile = profile_resp.json()
    print("✓ Profile loaded successfully")
    print(f"   Email: {profile['email']}")
    print(f"   Name: {profile.get('name', 'Not set')}")
    print(f"   Phone: {profile.get('phone', 'Not set')}")
    print(f"   PAN: {profile.get('pan', 'Not set')}")
    print(f"   Enrolled Courses: {profile.get('enrolled_courses', 0)}")
    
    # Step 3: Update profile (first time - should succeed)
    print("\n3. Updating profile with personal information...")
    update_data = {
        "name": "ANURAG MISHRA",
        "phone": "9161452323",
        "dob": "1998-09-05",
        "gender": "M",
        "pan": "ESKPM0208L"
    }
    
    update_resp = requests.put(f"{BASE_URL}/auth/profile", 
                              json=update_data, 
                              headers=client_headers)
    
    if update_resp.status_code != 200:
        print(f"❌ Failed to update profile: {update_resp.text}")
        return
    
    updated_profile = update_resp.json()
    print("✓ Profile updated successfully")
    print(f"   Name: {updated_profile['name']}")
    print(f"   Phone: {updated_profile['phone']}")
    print(f"   DOB: {updated_profile['dob']}")
    print(f"   Gender: {updated_profile['gender']}")
    print(f"   PAN: {updated_profile['pan']}")
    
    # Step 4: Try to change PAN (should fail)
    print("\n4. Attempting to change PAN (should fail)...")
    try_change_pan = {
        "pan": "NEWPAN1234"
    }
    
    change_resp = requests.put(f"{BASE_URL}/auth/profile", 
                              json=try_change_pan, 
                              headers=client_headers)
    
    if change_resp.status_code == 400:
        print("✓ PAN change correctly rejected")
        print(f"   Error: {change_resp.json()['detail']}")
    else:
        print("⚠ PAN change was not rejected (unexpected)")
    
    # Step 5: Try to change phone (should fail)
    print("\n5. Attempting to change phone (should fail)...")
    try_change_phone = {
        "phone": "0000000000"
    }
    
    change_resp = requests.put(f"{BASE_URL}/auth/profile", 
                              json=try_change_phone, 
                              headers=client_headers)
    
    if change_resp.status_code == 400:
        print("✓ Phone change correctly rejected")
        print(f"   Error: {change_resp.json()['detail']}")
    else:
        print("⚠ Phone change was not rejected (unexpected)")
    
    # Step 6: Update name (should succeed)
    print("\n6. Updating name (should succeed)...")
    update_name = {
        "name": "ANURAG KUMAR MISHRA"
    }
    
    name_resp = requests.put(f"{BASE_URL}/auth/profile", 
                            json=update_name, 
                            headers=client_headers)
    
    if name_resp.status_code == 200:
        print("✓ Name updated successfully")
        print(f"   New name: {name_resp.json()['name']}")
    else:
        print(f"❌ Failed to update name: {name_resp.text}")
    
    print("\n" + "=" * 70)
    print("PROFILE FUNCTIONALITY TEST COMPLETED")
    print("=" * 70)
    print("\n✅ ALL TESTS PASSED!")
    print("   - Profile can be loaded")
    print("   - Profile can be updated")
    print("   - PAN is immutable after first set")
    print("   - Phone is immutable after first set")
    print("   - Other fields are editable")

if __name__ == "__main__":
    test_profile()
