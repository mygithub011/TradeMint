"""
Test Neon Database Connection
"""
import sys
sys.path.insert(0, '.')

from app.db.database import engine, SessionLocal
from sqlalchemy import text

print('=' * 60)
print('Testing Neon Database Connection')
print('=' * 60)

try:
    print('\nDatabase engine created')
    print(f'URL: {str(engine.url)[:80]}...')
    
    # Test connection
    with engine.connect() as conn:
        result = conn.execute(text('SELECT version()'))
        version = result.fetchone()[0]
        print(f'\n✅ PostgreSQL Version:')
        print(f'   {version[:90]}...')
    
    # Test session
    db = SessionLocal()
    try:
        result = db.execute(text('SELECT current_database(), current_user'))
        db_name, user = result.fetchone()
        print(f'\n✅ Database Info:')
        print(f'   Database: {db_name}')
        print(f'   User: {user}')
        
        # Check tables
        result = db.execute(text(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
        ))
        table_count = result.fetchone()[0]
        print(f'   Tables: {table_count}')
        
        if table_count == 0:
            print(f'\n⚠️  No tables found - run migrations to create schema')
        else:
            # List tables
            result = db.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
            ))
            tables = [row[0] for row in result.fetchall()]
            print(f'\n✅ Existing tables:')
            for table in tables:
                print(f'   - {table}')
        
    finally:
        db.close()
    
    print('\n' + '=' * 60)
    print('✅ ✅ ✅  Connected to Neon Database!')
    print('=' * 60)
    
except Exception as e:
    print(f'\n❌ ERROR: {str(e)}')
    import traceback
    traceback.print_exc()
