"""
Create a test subscription for testing alert flow
"""
import sys
sys.path.insert(0, '.')

from app.db.database import SessionLocal
from app.models.models import Subscription, User, Service
from datetime import datetime, timedelta

db = SessionLocal()

try:
    # Get client user
    client = db.query(User).filter(User.email == 'client@example.com').first()
    if not client:
        print("❌ Client user not found. Run seed_local.py first.")
        exit(1)
    
    # Get first service
    service = db.query(Service).first()
    if not service:
        print("❌ No services found. Run seed_local.py first.")
        exit(1)
    
    # Check if subscription already exists
    existing_sub = db.query(Subscription).filter(
        Subscription.user_id == client.id,
        Subscription.service_id == service.id,
        Subscription.status == 'ACTIVE'
    ).first()
    
    if existing_sub:
        print(f"✓ Active subscription already exists (ID: {existing_sub.id})")
        print(f"   Client: {client.email}")
        print(f"   Service: {service.name}")
        print(f"   Valid until: {existing_sub.end_date}")
    else:
        # Create subscription
        subscription = Subscription(
            user_id=client.id,
            service_id=service.id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            status='ACTIVE'
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        
        print("✓ Test subscription created successfully!")
        print(f"   Client: {client.email}")
        print(f"   Service: {service.name}")
        print(f"   Valid until: {subscription.end_date}")

except Exception as e:
    print(f"❌ Error: {str(e)}")
    db.rollback()
finally:
    db.close()
