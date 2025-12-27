#!/usr/bin/env python3
"""
Seed script to create test data for TradeMint in the correct directory
"""
import os
import sys

# Change to the current directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import Base, engine, SessionLocal
from app.models.models import User, Trader, Service
from app.utils.auth import get_password_hash

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Clear existing data (optional)
    if db.query(User).count() > 0:
        print("Database already has data. Clearing and reseeding...")
        db.query(Service).delete()
        db.query(Trader).delete()
        db.query(User).delete()
        db.commit()

    print("\n🌱 Seeding database with test data...\n")

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
    db.flush()
    print("✓ Created trader user (trader@example.com / trader123)")

    # Create trader profile
    trader = Trader(
        user_id=trader_user.id,
        name="Rajesh Kumar",
        sebi_reg="INH000001234",
        pan_card="ABCDE1234F",
        image_url="https://ui-avatars.com/api/?name=Rajesh+Kumar&background=4F46E5&color=fff&size=200",
        bio="SEBI registered advisor with 10+ years of experience in equity and F&O trading. Specialized in intraday and swing trading strategies.",
        trades_per_day=5,
        approved=True
    )
    db.add(trader)
    db.flush()
    print("✓ Created trader profile (SEBI: INH000001234, Approved: True)")

    # Create sample services
    services_data = [
        {
            "name": "Equity Intraday Calls",
            "description": "High-accuracy intraday stock recommendations",
            "price": 5000,
            "duration_days": 30,
            "telegram_group_id": "-1003348280516"  # Your Telegram supergroup ID
        },
        {
            "name": "F&O Weekly Strategies",
            "description": "Futures & Options trading strategies",
            "price": 8000,
            "duration_days": 30,
            "telegram_group_id": "-1003348280516"  # Your Telegram supergroup ID
        },
        {
            "name": "Swing Trading Premium",
            "description": "Medium-term swing trading opportunities",
            "price": 12000,
            "duration_days": 90,
            "telegram_group_id": "-1003348280516"  # Your Telegram supergroup ID
        }
    ]

    for service_data in services_data:
        service = Service(
            trader_id=trader.id,
            **service_data,
            is_active=True
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
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
