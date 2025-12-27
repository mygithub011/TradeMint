import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_trader_registration_and_onboarding():
    """Test complete trader registration and onboarding flow"""
    
    # Test data
    test_email = f"testtrader{datetime.now().timestamp()}@example.com"
    test_password = "password123"
    
    print("=" * 70)
    print("TESTING TRADER REGISTRATION AND ONBOARDING")
    print("=" * 70)
    
    # Step 1: Register user
    print(f"\n1. Registering user: {test_email}")
    register_data = {
        "email": test_email,
        "password": test_password,
        "role": "trader"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 201]:
            print(f"   ✅ User registered successfully")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ❌ Registration failed: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 2: Login to get token
    print(f"\n2. Logging in to get access token...")
    login_data = {
        "username": test_email,
        "password": test_password
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"   ✅ Token received: {token[:50]}...")
        else:
            print(f"   ❌ Login failed: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 3: Onboard trader
    print(f"\n3. Onboarding trader with dummy data...")
    
    # Generate unique PAN (5 letters + 4 digits + 1 letter)
    import random
    import string
    pan_letters1 = ''.join(random.choices(string.ascii_uppercase, k=5))
    pan_digits = ''.join(random.choices(string.digits, k=4))
    pan_letter2 = random.choice(string.ascii_uppercase)
    unique_pan = f"{pan_letters1}{pan_digits}{pan_letter2}"
    
    onboard_data = {
        "name": "Test Trader",
        "sebi_reg": f"INH{int(datetime.now().timestamp()) % 1000000000}",
        "pan_card": unique_pan,
        "bio": "Expert trader with 10 years of experience",
        "image_url": "https://ui-avatars.com/api/?name=Test+Trader",
        "trades_per_day": 5
    }
    
    print(f"   Data to send:")
    print(f"   {json.dumps(onboard_data, indent=6)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/traders/onboard",
            json=onboard_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        print(f"\n   Response Status: {response.status_code}")
        print(f"   Response Body:")
        try:
            print(f"   {json.dumps(response.json(), indent=6)}")
        except:
            print(f"   {response.text}")
        
        if response.status_code == 201:
            print(f"\n   ✅ Trader onboarded successfully!")
            trader_data = response.json()
            print(f"   Trader ID: {trader_data.get('id')}")
            print(f"   Name: {trader_data.get('name')}")
            print(f"   SEBI Reg: {trader_data.get('sebi_reg')}")
            print(f"   Approved: {trader_data.get('approved')}")
            return True
        else:
            print(f"\n   ❌ Onboarding failed!")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_trader_registration_and_onboarding()
