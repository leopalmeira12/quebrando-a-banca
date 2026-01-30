from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine, Base
import models
import auth
import crud
import schemas
from typing import List
import uvicorn
import scraper
import jobs
import asyncio

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="InvestSport API")

# CORS configuration - Allow local development
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Revertendo para lista explicita por causa do withCredentials=True
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Auth Router
app.include_router(auth.router)

# ===== ROUTES =====

@app.get("/")
def read_root():
    return {"message": "InvestSport Backend is Running!", "status": "online"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@app.get("/dashboard-data")
async def get_dashboard_data(current_user: models.User = Depends(auth.get_current_active_user)):
    # Fetch real data from Google/Betano Scraper
    data = await scraper.get_dashboard_data_async()
    return {
        "data": data['teams'], 
        "stats": data['global_stats'],
        "live_opportunities": data['live_opportunities']
    }

@app.get("/bet-history", response_model=schemas.BetHistoryList)
def get_bet_history(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    bets = crud.get_user_bet_history(db, user_id=current_user.id, skip=skip, limit=limit)
    return {"bets": bets}

@app.put("/bet-history/{bet_id}/status")
def update_bet_status_endpoint(
    bet_id: int, 
    status_update: schemas.BetStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    bet = crud.update_bet_status(db, bet_id=bet_id, status=status_update.status, result_amount=status_update.result_amount)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet

@app.post("/combo-bet")
async def create_combo_bet(
    bet_data: schemas.ComboBetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # 1. Save to History as Pending
    bet_record = crud.create_bet_history(db, schemas.BetHistoryCreate(
        user_id=current_user.id,
        bet_type="COMBO",
        games_data=bet_data.games,
        total_odds=bet_data.total_odds,
        bet_amount=bet_data.bet_amount,
        potential_return=bet_data.potential_return,
        betano_url="https://www.betano.bet.br", # Placeholder
        is_simulated=True # Mark as simulated/monitored
    ))
    
    # 2. Trigger Bot (Automation) if needed
    # For now, we return the record and the frontend might trigger an open window
    
    return {
        "status": "success", 
        "message": "Combo criado e monitorado.", 
        "bet_id": bet_record.id
    }

@app.post("/bet-settings")
def save_bet_settings(
    settings: schemas.BetSettingsCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Check if exists
    existing = db.query(models.BetSettings).filter(models.BetSettings.user_id == current_user.id).first()
    if existing:
        for key, value in settings.dict().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_settings = models.BetSettings(**settings.dict(), user_id=current_user.id)
        db.add(new_settings)
        db.commit()
        db.refresh(new_settings)
        return new_settings

@app.get("/bet-settings")
def get_bet_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    settings = db.query(models.BetSettings).filter(models.BetSettings.user_id == current_user.id).first()
    if not settings:
        return {} # Return empty or default
    return settings


# ===== AUTOMATION ENDPOINTS =====

@app.post("/automation/open-browser")
async def automation_open_browser(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Launch browser for manual login if not valid
    """
    try:
        from automation_service import get_browser_instance
        page = await get_browser_instance()
        await page.goto("https://www.betano.bet.br")
        return {"status": "browser_opened", "message": "Navegador aberto. Faça login manualmente."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/automation/place-bet")
async def automation_place_bet(
    bet_data: schemas.ComboBetCreate,
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Automate betting process
    """
    # This would call the bot logic to select items in the open browser
    pass

@app.get("/automation/status")
async def automation_status(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Check if browser is open and logged in
    """
    try:
        from automation_service import check_login_status
        is_logged = await check_login_status()
        return {
            "status": "online",
            "is_logged_in": is_logged,
            "status": "LOGGED_IN" if is_logged else "NOT_LOGGED_IN"
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "is_logged_in": False}


# Start Background Tasks on Startup
@app.on_event("startup")
async def startup_event():
    # Start the monitoring job in background
    # Note: In production we use Celery or a separate process.
    # Here we can run a simple loop or just rely on manual triggers/polling
    pass
