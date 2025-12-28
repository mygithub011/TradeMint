"""
Test Terms & Conditions acceptance flow
"""
import sys
sys.path.insert(0, '.')

from app.db.database import SessionLocal
from app.models.models import User
import requests
import time

def test_terms_flow():
    print("=" * 70)
    print("Testing Terms & Conditions Acceptance Flow")
    print("=" * 70)
    
    # Test data
    test_email = f"test_terms_{int(time.time())}@example.com"
    test_password = "testpass123"
    
    print(f"\n1. Registering new user: {test_email}")
    
    # Register new user
    try:
        register_resp = requests.post('http://localhost:8000/auth/register',
            json={
                'email': test_email,
                'password': test_password,
                'role': 'client'
            },
            timeout=10
        )
        
        if register_resp.status_code == 201:
            print("   ✓ User registered successfully")
        else:
            print(f"   ✗ Registration failed: {register_resp.text}")
            return
            
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
        return
    
    print("\n2. Checking user in database...")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == test_email).first()
        if user:
            print(f"   ✓ User found in database (ID: {user.id})")
            print(f"   - Email: {user.email}")
            print(f"   - Role: {user.role}")
            print(f"   - Terms Accepted: {user.terms_accepted}")
            print(f"   - Terms Accepted At: {user.terms_accepted_at}")
        else:
            print("   ✗ User not found in database")
            return
    finally:
        db.close()
    
    print("\n3. Logging in...")
    
    try:
        login_resp = requests.post('http://localhost:8000/auth/login',
            data={
                'username': test_email,
                'password': test_password
            },
            timeout=10
        )
        
        if login_resp.status_code == 200:
            token = login_resp.json()['access_token']
            print("   ✓ Login successful")
            print(f"   - Token: {token[:30]}...")
        else:
            print(f"   ✗ Login failed: {login_resp.text}")
            return
            
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
        return
    
    print("\n4. Accepting terms...")
    
    try:
        accept_resp = requests.post('http://localhost:8000/auth/accept-terms',
            headers={'Authorization': f'Bearer {token}'},
            timeout=10
        )
        
        if accept_resp.status_code == 200:
            result = accept_resp.json()
            print("   ✓ Terms accepted successfully")
            print(f"   - Message: {result['message']}")
            print(f"   - Terms Accepted: {result['terms_accepted']}")
            print(f"   - Accepted At: {result['terms_accepted_at']}")
        else:
            print(f"   ✗ Accept terms failed: {accept_resp.text}")
            return
            
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
        return
    
    print("\n5. Verifying in database...")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == test_email).first()
        if user:
            print(f"   ✓ User updated in database")
            print(f"   - Terms Accepted: {user.terms_accepted}")
            print(f"   - Terms Accepted At: {user.terms_accepted_at}")
            
            if user.terms_accepted:
                print("\n✅ All tests passed! Terms acceptance flow working correctly.")
            else:
                print("\n❌ Test failed: Terms not marked as accepted in database")
        else:
            print("   ✗ User not found in database")
    finally:
        db.close()
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    test_terms_flow()
