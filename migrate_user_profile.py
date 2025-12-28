"""
Migration script to add profile fields to users table
"""
import sys
sys.path.insert(0, '.')

from app.db.database import SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("Adding Profile Fields to Users Table")
        print("=" * 60)
        
        # Add new columns
        alter_queries = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS dob VARCHAR;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS pan VARCHAR;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo VARCHAR;"
        ]
        
        for query in alter_queries:
            db.execute(text(query))
            column_name = query.split("ADD COLUMN IF NOT EXISTS ")[1].split(" ")[0]
            print(f"✓ Added column: {column_name}")
        
        db.commit()
        
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
