from sqlalchemy.orm import Session
import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, plan="free")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_bet_history(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.BetHistory).filter(models.BetHistory.user_id == user_id).order_by(models.BetHistory.created_at.desc()).offset(skip).limit(limit).all()

def create_bet_history(db: Session, bet: schemas.BetHistoryCreate):
    db_bet = models.BetHistory(**bet.dict())
    db.add(db_bet)
    db.commit()
    db.refresh(db_bet)
    return db_bet

def update_bet_status(db: Session, bet_id: int, status: str, result_amount: float = 0):
    bet = db.query(models.BetHistory).filter(models.BetHistory.id == bet_id).first()
    if bet:
        bet.status = status
        bet.result_amount = result_amount
        import datetime
        bet.settled_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(bet)
    return bet
