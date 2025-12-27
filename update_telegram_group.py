import sys
sys.path.insert(0, '.')
from app.db.database import SessionLocal
from app.models.models import Service

print("=" * 60)
print("Update Service with Telegram Group ID")
print("=" * 60)

# Get service ID and Telegram group ID from user
service_id = input("\nEnter Service ID (e.g., 4 for Crypto): ").strip()
telegram_group_id = input("Enter Telegram Supergroup ID (e.g., -1002345678901): ").strip()

if not service_id.isdigit():
    print("❌ Invalid service ID")
    exit(1)

service_id = int(service_id)

db = SessionLocal()
try:
    # Get the service
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        print(f"❌ Service with ID {service_id} not found")
        exit(1)
    
    print(f"\n✅ Found service: {service.name}")
    print(f"   Current Telegram Group ID: {service.telegram_group_id}")
    
    # Update the Telegram group ID
    service.telegram_group_id = telegram_group_id
    db.commit()
    db.refresh(service)
    
    print(f"\n✅ ✅ ✅ Successfully updated!")
    print(f"   Service: {service.name}")
    print(f"   New Telegram Group ID: {service.telegram_group_id}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    db.rollback()
finally:
    db.close()

print("\n" + "=" * 60)
