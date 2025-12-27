"""
Drop the message column from trade_alerts table
"""
import sqlite3
import os

DB_PATH = "smarttrade.db"

def drop_message_column():
    """Drop message column from trade_alerts table."""
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file {DB_PATH} not found!")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🔧 Dropping message column from trade_alerts table...")
        
        # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
        
        # 1. Create new table without message column
        cursor.execute("""
            CREATE TABLE trade_alerts_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_id INTEGER NOT NULL,
                trader_id INTEGER NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                stock_symbol VARCHAR NOT NULL,
                action VARCHAR NOT NULL,
                lot_size INTEGER,
                rate TEXT,
                target TEXT,
                stop_loss TEXT,
                cmp TEXT,
                validity TEXT,
                FOREIGN KEY (service_id) REFERENCES services(id),
                FOREIGN KEY (trader_id) REFERENCES traders(id)
            )
        """)
        
        # 2. Copy data from old table to new table (excluding message column)
        cursor.execute("""
            INSERT INTO trade_alerts_new 
            (id, service_id, trader_id, sent_at, stock_symbol, action, lot_size, rate, target, stop_loss, cmp, validity)
            SELECT id, service_id, trader_id, sent_at, stock_symbol, action, lot_size, rate, target, stop_loss, cmp, validity
            FROM trade_alerts
        """)
        
        # 3. Drop old table
        cursor.execute("DROP TABLE trade_alerts")
        
        # 4. Rename new table to original name
        cursor.execute("ALTER TABLE trade_alerts_new RENAME TO trade_alerts")
        
        print("✓ Message column dropped successfully")
        
        conn.commit()
        print("\n✅ Database schema updated successfully!")
        
    except sqlite3.Error as e:
        print(f"❌ Error updating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    drop_message_column()
