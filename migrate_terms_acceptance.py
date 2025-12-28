"""
Add terms_accepted columns to users table
Run this script to update the database schema
"""
import sys
sys.path.insert(0, '.')

from app.db.database import SessionLocal, engine
from sqlalchemy import text

def add_terms_columns():
    """Add terms_accepted and terms_accepted_at columns to users table"""
    
    print("=" * 60)
    print("Adding Terms Acceptance Columns to Users Table")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name IN ('terms_accepted', 'terms_accepted_at')
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        if 'terms_accepted' in existing_columns and 'terms_accepted_at' in existing_columns:
            print("\n✓ Columns already exist. No migration needed.")
            return
        
        print("\nAdding new columns...")
        
        # Add terms_accepted column
        if 'terms_accepted' not in existing_columns:
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE
            """))
            print("✓ Added 'terms_accepted' column")
        
        # Add terms_accepted_at column
        if 'terms_accepted_at' not in existing_columns:
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN terms_accepted_at TIMESTAMP
            """))
            print("✓ Added 'terms_accepted_at' column")
        
        # Set existing users to have accepted terms (grandfathering)
        db.execute(text("""
            UPDATE users 
            SET terms_accepted = TRUE, 
                terms_accepted_at = created_at 
            WHERE terms_accepted IS NULL OR terms_accepted = FALSE
        """))
        
        db.commit()
        
        print("\n✓ Migration completed successfully!")
        print("\nNote: Existing users have been grandfathered with terms acceptance.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error during migration: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_terms_columns()
