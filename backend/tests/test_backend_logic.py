import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
import pytest
from models import Base, User
from database import engine, SessionLocal
from schemas import UserCreate

# Setup database for testing
Base.metadata.create_all(bind=engine)

client = TestClient(app)

# Helper to create user and get token
def get_auth_header():
    # Create test user if not exists
    db = SessionLocal()
    if not db.query(User).filter(User.email == "test@example.com").first():
        client.post("/register", json={"email": "test@example.com", "password": "password123"})
    db.close()
    
    # Login
    response = client.post("/token", data={"username": "test@example.com", "password": "password123"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_bet_settings_lifecycle():
    headers = get_auth_header()
    
    # 1. Get default settings
    response = client.get("/bet-settings", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["default_bet_amount"] == 10.0
    assert "score_conditions" in data
    
    # 2. Update settings
    new_settings = data.copy()
    new_settings["default_bet_amount"] = 50.0
    new_settings["min_profit_percent"] = 2.5
    
    response = client.put("/bet-settings", json=new_settings, headers=headers)
    assert response.status_code == 200
    assert response.json()["default_bet_amount"] == 50.0
    
    # 3. Verify update persisted
    response = client.get("/bet-settings", headers=headers)
    assert response.json()["min_profit_percent"] == 2.5

def test_combo_bet_calculation():
    headers = get_auth_header()
    
    # Mock games payload
    combo_payload = {
        "games": [
            {
                "game_id": "game1",
                "home": "Team A",
                "away": "Team B",
                "bet_type": "1X2",
                "recommendation": "Team A",
                "odds": 1.50,
                "confidence": 80
            },
            {
                "game_id": "game2",
                "home": "Team C",
                "away": "Team D",
                "bet_type": "UNDER_2.5",
                "recommendation": "Under",
                "odds": 2.00,
                "confidence": 90
            }
        ],
        "bet_amount": 20.0
    }
    
    # Create combo bet (API logic test, not browser)
    # Note: This endpoint creates a database record. The bot part is in a separate endpoint /betano/place-combo
    response = client.post("/combo-bet", json=combo_payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate Odds Calculation: 1.50 * 2.00 = 3.00
    assert data["total_odds"] == 3.00
    
    # Validate Return: 20 * 3.00 = 60.00
    assert data["potential_return"] == 60.00
    
    # Validate History Record
    bet_id = data["id"]
    history_response = client.get("/bet-history", headers=headers)
    history = history_response.json()
    
    assert any(b["id"] == bet_id for b in history["bets"])

if __name__ == "__main__":
    # Allow running directly
    try:
        test_health_check()
        test_bet_settings_lifecycle()
        test_combo_bet_calculation()
        print("✅ All backend logic tests passed!")
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
