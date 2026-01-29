import sqlite3
import os

DB_FILE = "db.sqlite3"

def upgrade_db():
    if not os.path.exists(DB_FILE):
        print("Database not found, skipping migration (will be created automatically).")
        return

    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(bet_settings)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "betano_password_encrypted" not in columns:
            print("Adding betano_password_encrypted column...")
            cursor.execute("ALTER TABLE bet_settings ADD COLUMN betano_password_encrypted VARCHAR")
            conn.commit()
            print("Column betano_password_encrypted added.")

        if "daily_profit_target" not in columns:
            print("Adding daily_profit_target column...")
            cursor.execute("ALTER TABLE bet_settings ADD COLUMN daily_profit_target FLOAT DEFAULT 3.0")
            conn.commit()
            print("Column daily_profit_target added.")
            
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    upgrade_db()
