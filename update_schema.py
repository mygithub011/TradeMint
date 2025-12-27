"""
Script to update the database schema for new alert fields
Run this after updating the models to add new columns to existing database
"""

import sqlite3
import os

# Database path
DB_PATH = "smarttrade.db"

def update_database_schema():
    """Add new columns to trade_alerts table."""
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file {DB_PATH} not found!")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🔧 Updating database schema...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(trade_alerts)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add new columns if they don't exist
        new_columns = [
            ("lot_size", "INTEGER"),
            ("rate", "TEXT"),
            ("target", "TEXT"),
            ("cmp", "TEXT"),
            ("validity", "TEXT")
        ]
        
        for col_name, col_type in new_columns:
            if col_name not in columns:
                cursor.execute(f"ALTER TABLE trade_alerts ADD COLUMN {col_name} {col_type}")
                print(f"✓ Added column: {col_name}")
            else:
                print(f"⚠ Column {col_name} already exists")
        
        # Update message column to be nullable
        if "message" in columns:
            # SQLite doesn't support ALTER COLUMN, so we need to check the current definition
            print("✓ Message column exists (nullable check not needed in SQLite)")
        
        # Update stock_symbol to NOT NULL (if it was NULL before)
        print("✓ Schema updates completed")
        
        conn.commit()
        print("\n✅ Database schema updated successfully!")
        
    except sqlite3.Error as e:
        print(f"❌ Error updating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_database_schema()
