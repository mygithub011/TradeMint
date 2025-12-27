"""
Test trader registration through the UI flow
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_ui_flow():
    print("Testing Trader Registration Flow (matching UI)")
    print("=" * 70)
    
    # User data
    email = "uitest@example.com"
    password = "test1234"
    
    # Step 1: Register User
    print("\n1. Registering user...")
    register_payload = {
        "email": email,
        "password": password,
        "role": "trader"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.json()}")
        
        if resp.status_code not in [200, 201]:
            print("   ❌ Registration failed")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 2: Login (what the UI does)
    print("\n2. Logging in to get token...")
    login_data = {
        "username": email,
        "password": password
    }
    
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,  # Form data
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"   Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"   Response: {resp.text}")
            print("   ❌ Login failed")
            return
        
        token = resp.json()["access_token"]
        print(f"   ✅ Got token")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 3: Onboard (what the UI does)
    print("\n3. Onboarding trader...")
    onboard_payload = {
        "name": "UI Test Trader",
        "sebi_reg": "INH999888777",
        "pan_card": "QWERT1234Z",
        "bio": "Test bio from UI flow",
        "image_url": "https://example.com/img.jpg",
        "trades_per_day": 10
    }
    
    print(f"   Payload: {json.dumps(onboard_payload, indent=6)}")
    
    try:
        resp = requests.post(
            f"{BASE_URL}/traders/onboard",
            json=onboard_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        print(f"\n   Status: {resp.status_code}")
        print(f"   Response:")
        try:
            print(json.dumps(resp.json(), indent=6))
        except:
            print(resp.text)
        
        if resp.status_code == 201:
            print("\n   ✅ SUCCESS! Trader onboarded!")
        else:
            print("\n   ❌ Onboarding failed!")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ui_flow()
