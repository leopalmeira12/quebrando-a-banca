
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, crud, schemas
from passlib.context import CryptContext

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

def create_admin_user():
    db = SessionLocal()
    email = "leandro2703palmeira@gmail.com"
    password = "123456"
    
    try:
        user = crud.get_user_by_email(db, email=email)
        if user:
            print(f"User {email} already exists. Updating password...")
            # Update password just in case it's wrong
            hashed_password = crud.get_password_hash(password)
            user.hashed_password = hashed_password
            db.commit()
            print("Password updated successfully.")
        else:
            print(f"Creating user {email}...")
            # Create manually to skip schema validation if needed, or use crud
            hashed_password = crud.get_password_hash(password)
            db_user = models.User(email=email, hashed_password=hashed_password, plan="pro")
            db.add(db_user)
            db.commit()
            print(f"User {email} created successfully.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
