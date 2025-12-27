import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("Testing Send Alert Functionality")
print("=" * 60)

# Step 1: Login as trader
print("\n1. Logging in as trader...")
login_data = {
    "username": "trader@example.com",
    "password": "trader123"
}

login_response = requests.post(
    f"{BASE_URL}/auth/login",
    data=login_data
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(f"Response: {login_response.text}")
    exit(1)

token = login_response.json()["access_token"]
print(f"✅ Login successful! Token: {token[:20]}...")

# Step 2: Get trader's services
print("\n2. Fetching trader's services...")
headers = {"Authorization": f"Bearer {token}"}

services_response = requests.get(
    f"{BASE_URL}/traders/services",
    headers=headers
)

if services_response.status_code != 200:
    print(f"❌ Failed to fetch services: {services_response.status_code}")
    print(f"Response: {services_response.text}")
    exit(1)

services = services_response.json()
print(f"✅ Found {len(services)} services:")
for svc in services:
    print(f"   - ID: {svc['id']}, Name: {svc['name']}, Active: {svc['is_active']}")

if not services:
    print("❌ No services found! Cannot send alert.")
    exit(1)

# Use the first active service
service_id = None
for svc in services:
    if svc['is_active']:
        service_id = svc['id']
        print(f"\n✅ Using service: {svc['name']} (ID: {service_id})")
        break

if not service_id:
    print("❌ No active services found!")
    exit(1)

# Step 3: Send trade alert
print("\n3. Sending trade alert...")
alert_data = {
    "service_id": service_id,
    "stock_symbol": "RELIANCE",
    "action": "BUY",
    "lot_size": 100,
    "rate": 2500.50,
    "target": 2650.00,
    "stop_loss": 2400.00,
    "cmp": 2505.00,
    "validity": "31/12/2025"
}

print(f"\nAlert Data:")
print(json.dumps(alert_data, indent=2))

alert_response = requests.post(
    f"{BASE_URL}/alerts/",
    headers={
        **headers,
        "Content-Type": "application/json"
    },
    json=alert_data
)

print(f"\nResponse Status: {alert_response.status_code}")
print(f"Response Headers: {dict(alert_response.headers)}")
print(f"\nResponse Body:")
print(json.dumps(alert_response.json() if alert_response.headers.get('content-type') == 'application/json' else alert_response.text, indent=2))

if alert_response.status_code == 201:
    print("\n✅ ✅ ✅ Trade alert sent successfully!")
else:
    print(f"\n❌ Failed to send alert: {alert_response.status_code}")
    print(f"Error: {alert_response.text}")

print("\n" + "=" * 60)
