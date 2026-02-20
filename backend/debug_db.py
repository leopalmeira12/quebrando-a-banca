from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import GameResult
import os

DATABASE_URL = "sqlite:///../data/games.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_db():
    db = SessionLocal()
    count = db.query(GameResult).count()
    last = db.query(GameResult).order_by(GameResult.id.desc()).limit(5).all()
    print(f"\n--- DEBUG BANCO DE DADOS ---")
    print(f"Total de registros: {count}")
    print(f"Últimos 5 multiplicadores:")
    for r in last:
        print(f"ID: {r.id} | Jogo: {r.game} | Valor: {r.multiplier}x | Hora: {r.timestamp}")
    db.close()

if __name__ == "__main__":
    check_db()
