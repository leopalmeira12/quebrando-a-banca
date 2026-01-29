from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

# Enums for strict type safety
class PlanType(str, enum.Enum):
    free = "free"
    pro = "pro"

class GameResult(str, enum.Enum):
    WIN = "V"
    DRAW = "E"
    LOSS = "D"

class Region(str, enum.Enum):
    BRASIL = "Brasil"
    EUROPA = "Europa"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    plan = Column(String, default="free") 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship to subscriptions (1:1)
    subscription = relationship("Subscription", back_populates="user", uselist=False)

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan_type = Column(String, default="free") # Should align with PlanType enum in logic
    active = Column(Boolean, default=True)
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime)

    user = relationship("User", back_populates="subscription")

# Enhanced models for storing historical data (Phase 2+)
class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    region = Column(String, nullable=False) # Brasil or Europa
    
    # Relationships
    games = relationship("Game", back_populates="team")

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    opponent = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    result = Column(String, nullable=False) # V, E, D
    odds_data = Column(JSON) # Store odds snapshot provided by scraper
    
    team = relationship("Team", back_populates="games")

# Betting Settings for Quick Bet feature
class BetSettings(Base):
    __tablename__ = "bet_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Betting limits
    default_bet_amount = Column(Float, default=10.0)
    max_bet_amount = Column(Float, default=100.0)
    min_confidence = Column(Integer, default=75)  # Só apostar se IA >= 75%
    max_games_combo = Column(Integer, default=5)  # Máximo de jogos na combinada
    
    # ===== PRE-CONFIGURED BET CONDITIONS =====
    # Accepted bet types (JSON array: ["UNDER", "1X2", "BTTS", "OVER"])
    accepted_bet_types = Column(JSON, default=["UNDER", "1X2", "BTTS", "OVER"])
    
    # Odds limits
    min_odds = Column(Float, default=1.10)  # Odd mínima para aceitar
    max_odds = Column(Float, default=5.00)  # Odd máxima para aceitar
    
    # Game time conditions
    min_minute = Column(Integer, default=65)  # Só apostar após minuto X
    max_minute = Column(Integer, default=88)  # Não apostar após minuto X
    
    # Score conditions (JSON: {"min_diff": 2, "max_total_goals": 5})
    score_conditions = Column(JSON, default={"min_diff": 0, "max_total_goals": 10})
    
    # ===== PROFIT TARGET PER GAME =====
    # Profit targets
    min_profit_percent = Column(Float, default=1.0)
    max_profit_percent = Column(Float, default=5.0)
    daily_profit_target = Column(Float, default=3.0) # Meta diária em %
    
    # Notification preferences
    enable_sound_alerts = Column(Boolean, default=True)
    enable_push_notifications = Column(Boolean, default=False)
    
    # Optional: encrypted credentials (NOT stored in plain text)
    betano_email_encrypted = Column(String, nullable=True)
    betano_password_encrypted = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", backref="bet_settings")

# Bet History for tracking combos
class BetHistory(Base):
    __tablename__ = "bet_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Combo details
    bet_type = Column(String, default="combo")  # "single" or "combo"
    games_data = Column(JSON)  # Array of selected games with their odds
    total_odds = Column(Float, nullable=False)
    bet_amount = Column(Float, nullable=False)
    potential_return = Column(Float, nullable=False)
    
    # Status
    status = Column(String, default="pending")  # pending, won, lost, cancelled
    result_amount = Column(Float, nullable=True)  # Actual return if won
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    settled_at = Column(DateTime, nullable=True)
    
    # Link for quick access
    betano_url = Column(String, nullable=True)
    
    # Simulation flag
    is_simulated = Column(Boolean, default=False)
    
    user = relationship("User", backref="bet_history")
