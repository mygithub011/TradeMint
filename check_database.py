"""
Script to inspect the Smart Trade database tables and data.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.models import User, Trader, Service, Subscription, TradeAlert
from sqlalchemy import inspect

def check_database():
    """Check database tables and display data."""
    db = SessionLocal()
    
    try:
        print("\n" + "="*70)
        print("SMART TRADE DATABASE INSPECTION")
        print("="*70)
        
        # Check Users table
        print("\n📊 USERS TABLE:")
        print("-" * 70)
        users = db.query(User).all()
        if users:
            print(f"Total Users: {len(users)}\n")
            for user in users:
                print(f"ID: {user.id} | Email: {user.email} | Role: {user.role} | Created: {user.created_at}")
        else:
            print("No users found in database.")
        
        # Check Traders table
        print("\n" + "="*70)
        print("📊 TRADERS TABLE:")
        print("-" * 70)
        traders = db.query(Trader).all()
        if traders:
            print(f"Total Traders: {len(traders)}\n")
            for trader in traders:
                user = db.query(User).filter(User.id == trader.user_id).first()
                status = "✅ Approved" if trader.approved else "⏳ Pending"
                print(f"ID: {trader.id} | User: {user.email if user else 'N/A'} | SEBI: {trader.sebi_reg} | Status: {status}")
        else:
            print("No traders found in database.")
        
        # Check Services table
        print("\n" + "="*70)
        print("📊 SERVICES TABLE:")
        print("-" * 70)
        services = db.query(Service).all()
        if services:
            print(f"Total Services: {len(services)}\n")
            for service in services:
                status = "🟢 Active" if service.is_active else "🔴 Inactive"
                print(f"ID: {service.id} | Name: {service.name} | Price: ₹{service.price} | Duration: {service.duration_days} days | {status}")
        else:
            print("No services found in database.")
        
        # Check Subscriptions table
        print("\n" + "="*70)
        print("📊 SUBSCRIPTIONS TABLE:")
        print("-" * 70)
        subscriptions = db.query(Subscription).all()
        if subscriptions:
            print(f"Total Subscriptions: {len(subscriptions)}\n")
            for sub in subscriptions:
                user = db.query(User).filter(User.id == sub.user_id).first()
                service = db.query(Service).filter(Service.id == sub.service_id).first()
                print(f"ID: {sub.id} | User: {user.email if user else 'N/A'} | Service: {service.name if service else 'N/A'}")
                print(f"   Status: {sub.status} | Start: {sub.start_date} | End: {sub.end_date}")
        else:
            print("No subscriptions found in database.")
        
        # Check Trade Alerts table
        print("\n" + "="*70)
        print("📊 TRADE ALERTS TABLE:")
        print("-" * 70)
        alerts = db.query(TradeAlert).all()
        if alerts:
            print(f"Total Alerts: {len(alerts)}\n")
            for alert in alerts:
                print(f"ID: {alert.id} | Service ID: {alert.service_id} | Symbol: {alert.stock_symbol or 'N/A'} | Action: {alert.action or 'N/A'}")
                print(f"   Message: {alert.message[:50]}... | Sent: {alert.sent_at}")
        else:
            print("No trade alerts found in database.")
        
        # Database statistics
        print("\n" + "="*70)
        print("📈 DATABASE STATISTICS:")
        print("-" * 70)
        print(f"Total Users: {db.query(User).count()}")
        print(f"  - Admins: {db.query(User).filter(User.role == 'admin').count()}")
        print(f"  - Traders: {db.query(User).filter(User.role == 'trader').count()}")
        print(f"  - Clients: {db.query(User).filter(User.role == 'client').count()}")
        print(f"\nTotal Traders: {db.query(Trader).count()}")
        print(f"  - Approved: {db.query(Trader).filter(Trader.approved == True).count()}")
        print(f"  - Pending: {db.query(Trader).filter(Trader.approved == False).count()}")
        print(f"\nTotal Services: {db.query(Service).count()}")
        print(f"  - Active: {db.query(Service).filter(Service.is_active == True).count()}")
        print(f"\nTotal Subscriptions: {db.query(Subscription).count()}")
        print(f"  - Active: {db.query(Subscription).filter(Subscription.status == 'ACTIVE').count()}")
        print(f"  - Expired: {db.query(Subscription).filter(Subscription.status == 'EXPIRED').count()}")
        
        print("\n" + "="*70)
        print("Database Location: smarttrade.db")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_database()
