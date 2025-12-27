#!/usr/bin/env python3
"""
Migration script to add PAN card and rejection_reason fields to traders table
"""
import os
import sys
import sqlite3

# Change to the current directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Path to the database
DB_PATH = "smarttrade.db"

def migrate():
    """Add PAN card and rejection_reason columns to traders table"""
    print("Starting migration: Adding PAN card and rejection_reason to traders table...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Add pan_card column (without UNIQUE constraint initially)
        try:
            cursor.execute("ALTER TABLE traders ADD COLUMN pan_card TEXT")
            print("✓ Added 'pan_card' column")
            
            # Update existing records with placeholder PAN
            cursor.execute("UPDATE traders SET pan_card = 'PAN' || CAST(id AS TEXT) || '1234A' WHERE pan_card IS NULL")
            print("✓ Updated existing records with placeholder PAN")
            
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- 'pan_card' column already exists")
            else:
                raise
        
        # Add rejection_reason column
        try:
            cursor.execute("ALTER TABLE traders ADD COLUMN rejection_reason TEXT")
            print("✓ Added 'rejection_reason' column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- 'rejection_reason' column already exists")
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
