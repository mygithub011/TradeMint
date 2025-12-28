"""
Migration script to add alert_recipients table
"""
import sys
sys.path.insert(0, '.')

from app.db.database import engine, SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("Creating alert_recipients table...")
        print("=" * 60)
        
        # Create alert_recipients table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS alert_recipients (
            id SERIAL PRIMARY KEY,
            alert_id INTEGER NOT NULL REFERENCES trade_alerts(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
            received_at TIMESTAMP NOT NULL DEFAULT NOW(),
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP NULL
        );
        """
        
        db.execute(text(create_table_query))
        db.commit()
        print("✓ alert_recipients table created successfully!")
        
        # Create unique constraint
        print("\nCreating unique constraint...")
        unique_constraint_query = """
        ALTER TABLE alert_recipients 
        ADD CONSTRAINT unique_alert_user UNIQUE (alert_id, user_id);
        """
        
        try:
            db.execute(text(unique_constraint_query))
            db.commit()
            print("✓ Unique constraint created successfully!")
        except Exception as e:
            if "already exists" not in str(e):
                raise
        
        # Create indexes for better query performance
        print("\nCreating indexes...")
        
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_alert_recipients_user_id ON alert_recipients(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_alert_recipients_alert_id ON alert_recipients(alert_id);",
            "CREATE INDEX IF NOT EXISTS idx_alert_recipients_is_read ON alert_recipients(user_id, is_read);",
            "CREATE INDEX IF NOT EXISTS idx_alert_recipients_received_at ON alert_recipients(received_at DESC);"
        ]
        
        for idx_query in indexes:
            db.execute(text(idx_query))
        
        db.commit()
        print("✓ Indexes created successfully!")
        
        # Backfill existing alerts to current subscribers
        print("\nBackfilling alert recipients for existing alerts...")
        
        backfill_query = """
        INSERT INTO alert_recipients (alert_id, user_id, subscription_id, received_at, is_read)
        SELECT 
            ta.id as alert_id,
            s.user_id,
            s.id as subscription_id,
            ta.sent_at as received_at,
            TRUE as is_read  -- Mark historical alerts as read
        FROM trade_alerts ta
        JOIN subscriptions s ON s.service_id = ta.service_id
        WHERE s.status = 'ACTIVE'
        AND s.start_date <= ta.sent_at
        AND s.end_date >= ta.sent_at
        ON CONFLICT (alert_id, user_id) DO NOTHING;
        """
        
        result = db.execute(text(backfill_query))
        db.commit()
        
        print(f"✓ Backfilled {result.rowcount} historical alert recipients")
        
        print("\n" + "=" * 60)
        print("Migration completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
