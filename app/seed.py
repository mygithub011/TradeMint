"""
Seed script to populate the database with test data.
Run this after setting up the database for the first time.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.models import User, Trader, Service
from app.utils.auth import get_password_hash

def seed_database():
    """Seed database with initial test data."""
    db = SessionLocal()
    
    try:
        print("🌱 Seeding database with test data...")
        
        # Check if data already exists
        if db.query(User).count() > 0:
            print("⚠️  Database already contains data. Skipping seed.")
            return
        
        # Create admin user
        admin = User(
            email="admin@smarttrade.com",
            password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)
        print("✓ Created admin user (admin@smarttrade.com / admin123)")
        
        # Create trader user
        trader_user = User(
            email="trader@example.com",
            password=get_password_hash("trader123"),
            role="trader"
        )
        db.add(trader_user)
        db.flush()  # Get the ID
        print("✓ Created trader user (trader@example.com / trader123)")
        
        # Create trader profile
        trader = Trader(
            user_id=trader_user.id,
            sebi_reg="INH000001234",
            approved=True
        )
        db.add(trader)
        db.flush()  # Get the ID
        print("✓ Created trader profile (SEBI: INH000001234)")
        
        # Create sample services
        services_data = [
            {
                "name": "Equity Intraday Calls",
                "description": "High-accuracy intraday stock recommendations with strict risk management",
                "price": 5000,
                "duration_days": 30
            },
            {
                "name": "F&O Weekly Strategies",
                "description": "Futures & Options trading strategies for weekly expiry",
                "price": 8000,
                "duration_days": 30
            },
            {
                "name": "Swing Trading Premium",
                "description": "Medium-term swing trading opportunities in equity markets",
                "price": 12000,
                "duration_days": 90
            }
        ]
        
        for service_data in services_data:
            service = Service(
                trader_id=trader.id,
                **service_data
            )
            db.add(service)
            print(f"✓ Created service: {service_data['name']}")
        
        # Create client user
        client = User(
            email="client@example.com",
            password=get_password_hash("client123"),
            role="client"
        )
        db.add(client)
        print("✓ Created client user (client@example.com / client123)")
        
        db.commit()
        
        print("\n" + "="*50)
        print("✅ Database seeded successfully!")
        print("="*50)
        print("\nTest Accounts Created:")
        print("\n1. Admin:")
        print("   Email: admin@smarttrade.com")
        print("   Password: admin123")
        print("\n2. Trader:")
        print("   Email: trader@example.com")
        print("   Password: trader123")
        print("   SEBI Reg: INH000001234")
        print("   Status: Approved")
        print("\n3. Client:")
        print("   Email: client@example.com")
        print("   Password: client123")
        print("\nServices Created: 3")
        print("\nYou can now test the API at http://127.0.0.1:8000/docs")
        print("="*50)
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
