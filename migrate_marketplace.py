#!/usr/bin/env python3
"""
Migration script to add marketplace fields to traders table
"""
import os
import sys
import sqlite3

# Change to the current directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Path to the database
DB_PATH = "smarttrade.db"

def migrate():
    """Add new marketplace columns to traders table"""
    print("Starting migration: Adding marketplace fields to traders table...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Add name column
        try:
            cursor.execute("ALTER TABLE traders ADD COLUMN name TEXT")
            print("✓ Added 'name' column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- 'name' column already exists")
            else:
                raise
        
        # Add image_url column
        try:
            cursor.execute("ALTER TABLE traders ADD COLUMN image_url TEXT")
            print("✓ Added 'image_url' column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- 'image_url' column already exists")
            else:
                raise
        
        # Add bio column
        try:
            cursor.execute("ALTER TABLE traders ADD COLUMN bio TEXT")
            print("✓ Added 'bio' column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- 'bio' column already exists")
            else:
                raise
        
        # Add trades_per_day column
        try:
            cursor.execute("ALTER TABLE traders ADD COLUMN trades_per_day INTEGER DEFAULT 0")
            print("✓ Added 'trades_per_day' column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- 'trades_per_day' column already exists")
            else:
                raise
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Show current schema
        cursor.execute("PRAGMA table_info(traders)")
        columns = cursor.fetchall()
        print("\nCurrent traders table schema:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
