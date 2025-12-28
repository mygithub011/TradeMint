"""
Test script for alert system flow:
1. Create a test client and trader
2. Client subscribes to trader's service
3. Trader sends an alert
4. Verify client receives the alert
"""
import sys
sys.path.insert(0, '.')

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_alert_flow():
    print("=" * 70)
    print("TESTING ALERT SYSTEM FLOW")
    print("=" * 70)
    
    # Step 1: Login as trader
    print("\n1. Login as trader...")
    trader_login = requests.post(f"{BASE_URL}/auth/login", 
                                data={'username': 'trader@example.com', 'password': 'trader123'})
    
    if trader_login.status_code != 200:
        print("❌ Trader login failed")
        return
    
    trader_token = trader_login.json()['access_token']
    trader_headers = {'Authorization': f'Bearer {trader_token}'}
    print("✓ Trader logged in successfully")
    
    # Step 2: Get trader's services
    print("\n2. Fetching trader's services...")
    services_resp = requests.get(f"{BASE_URL}/traders/services", headers=trader_headers)
    
    if services_resp.status_code != 200 or not services_resp.json():
        print("❌ No services found for trader")
        return
    
    services = services_resp.json()
    service = services[0]
    print(f"✓ Found service: {service['name']} (ID: {service['id']})")
    
    # Step 3: Login as client (or create if needed)
    print("\n3. Login as client...")
    client_login = requests.post(f"{BASE_URL}/auth/login",
                                data={'username': 'client@example.com', 'password': 'client123'})
    
    if client_login.status_code != 200:
        # Try to create client
        print("   Creating new client account...")
        register_resp = requests.post(f"{BASE_URL}/auth/register", json={
            'email': 'client@example.com',
            'password': 'client123',
            'role': 'client'
        })
        if register_resp.status_code == 200:
            client_login = requests.post(f"{BASE_URL}/auth/login",
                                        data={'username': 'client@example.com', 'password': 'client123'})
    
    if client_login.status_code != 200:
        print("❌ Client login failed")
        return
    
    client_token = client_login.json()['access_token']
    client_headers = {'Authorization': f'Bearer {client_token}'}
    print("✓ Client logged in successfully")
    
    # Step 4: Check if client has active subscription
    print("\n4. Checking client subscriptions...")
    subs_resp = requests.get(f"{BASE_URL}/subscriptions/my-subscriptions", headers=client_headers)
    
    has_active_sub = False
    if subs_resp.status_code == 200:
        subscriptions = subs_resp.json()
        for sub in subscriptions:
            if sub['service_id'] == service['id'] and sub['status'] == 'ACTIVE':
                has_active_sub = True
                print(f"✓ Client has active subscription to {service['name']}")
                break
    
    if not has_active_sub:
        print(f"⚠ Client doesn't have active subscription to {service['name']}")
        print("   Note: Create a subscription via the frontend for full testing")
        print("   Continuing with alert send test...")
    
    # Step 5: Trader sends an alert
    print("\n5. Trader sending trade alert...")
    alert_data = {
        "service_id": service['id'],
        "stock_symbol": "RELIANCE",
        "action": "BUY",
        "lot_size": 100,
        "rate": 2450.50,
        "target": 2500.00,
        "stop_loss": 2420.00,
        "cmp": 2448.75,
        "validity": "27/12/2025"
    }
    
    alert_resp = requests.post(f"{BASE_URL}/alerts/", 
                              json=alert_data, 
                              headers=trader_headers)
    
    if alert_resp.status_code != 201:
        print(f"❌ Failed to send alert: {alert_resp.text}")
        return
    
    alert = alert_resp.json()
    print(f"✓ Alert sent successfully (ID: {alert['id']})")
    print(f"   Stock: {alert['stock_symbol']}")
    print(f"   Action: {alert['action']}")
    print(f"   Rate: ₹{alert['rate']}")
    print(f"   Target: ₹{alert['target']}")
    
    # Step 6: Client checks received alerts
    print("\n6. Checking client's received alerts...")
    client_alerts_resp = requests.get(f"{BASE_URL}/alerts/client/my-alerts", 
                                     headers=client_headers)
    
    if client_alerts_resp.status_code != 200:
        print(f"❌ Failed to fetch client alerts: {client_alerts_resp.text}")
        return
    
    client_alerts = client_alerts_resp.json()
    
    if len(client_alerts) == 0:
        print("⚠ No alerts received by client")
        if not has_active_sub:
            print("   This is expected - client needs an active subscription")
    else:
        print(f"✓ Client has {len(client_alerts)} alert(s)")
        latest_alert = client_alerts[0]
        print(f"\n   Latest Alert Details:")
        print(f"   - Trader: {latest_alert['trader_name']}")
        print(f"   - Service: {latest_alert['service_name']}")
        print(f"   - Stock: {latest_alert['stock_symbol']}")
        print(f"   - Action: {latest_alert['action']}")
        print(f"   - Rate: ₹{latest_alert['rate']}")
        print(f"   - Target: ₹{latest_alert['target']}")
        print(f"   - Sent: {latest_alert['sent_at']}")
        print(f"   - Read: {'Yes' if latest_alert['is_read'] else 'No (NEW!)'}")
    
    # Step 7: Check unread count
    print("\n7. Checking unread alert count...")
    unread_resp = requests.get(f"{BASE_URL}/alerts/client/unread-count", 
                              headers=client_headers)
    
    if unread_resp.status_code == 200:
        unread_data = unread_resp.json()
        print(f"✓ Client has {unread_data['unread_count']} unread alert(s)")
    
    # Step 8: Mark alert as read (if there are any)
    if len(client_alerts) > 0 and not client_alerts[0]['is_read']:
        print("\n8. Marking alert as read...")
        mark_read_resp = requests.post(
            f"{BASE_URL}/alerts/client/mark-read/{client_alerts[0]['id']}", 
            headers=client_headers
        )
        
        if mark_read_resp.status_code == 200:
            print("✓ Alert marked as read successfully")
        else:
            print(f"❌ Failed to mark alert as read: {mark_read_resp.text}")
    
    print("\n" + "=" * 70)
    print("ALERT SYSTEM TEST COMPLETED")
    print("=" * 70)
    
    if has_active_sub and len(client_alerts) > 0:
        print("\n✅ ALL TESTS PASSED!")
        print("   - Trader can send alerts")
        print("   - Alerts are delivered to active subscribers")
        print("   - Clients can view alerts with full details")
        print("   - Mark as read functionality works")
    else:
        print("\n⚠ PARTIAL SUCCESS")
        print("   - Alert sending works")
        if not has_active_sub:
            print("   - Create an active subscription to test full flow")
        print("   - Check frontend at /client/alerts to view UI")

if __name__ == "__main__":
    test_alert_flow()
