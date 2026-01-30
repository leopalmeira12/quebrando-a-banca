
from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def migrate_db():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            print("Checking migrations...")
            # Check if column exists, if not add it
            result = conn.execute(text("PRAGMA table_info(bet_history)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'is_simulated' not in columns:
                print("Adding column is_simulated to bet_history...")
                conn.execute(text("ALTER TABLE bet_history ADD COLUMN is_simulated BOOLEAN DEFAULT 0"))
                conn.commit()
                print("Migration successful.")
            else:
                print("Column 'is_simulated' already exists.")
                
            # Check for 'updated_at' column in bet_history
            if 'updated_at' not in columns: # Check list again or just try
                 try:
                     conn.execute(text("ALTER TABLE bet_history ADD COLUMN updated_at DATETIME"))
                     conn.commit()
                     print("Added updated_at column.")
                 except: pass # It might fail if already exists or other reason
                 
        except Exception as e:
            print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate_db()
