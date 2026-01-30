from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserSchema(UserBase):
    id: int
    plan: str
    created_at: Any
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class GameInfo(BaseModel):
    opponent: str
    date: str
    is_home: bool
    competition: str
    best_odd: float
    best_bookmaker: str

class TeamAnalysis(BaseModel):
    team: str
    region: str
    status: str
    probability: int # Mudado para Int para facilitar contas no front
    probability_text: str
    streak: int
    lineup_strength: int # 0-100
    last_5_results: List[str] # ["V", "D", "E"...]
    next_games: List[GameInfo] # Lista com proximos 2 jogos
    recommendation_reason: str
    color_code: str

# Bet Settings Schemas
class BetSettingsBase(BaseModel):
    default_bet_amount: float = 10.0
    max_bet_amount: float = 100.0
    min_confidence: int = 75
    max_games_combo: int = 5
    enable_sound_alerts: bool = True
    enable_push_notifications: bool = False
    # Pre-configured bet conditions
    accepted_bet_types: List[str] = ["UNDER", "1X2", "BTTS", "OVER"]
    min_odds: float = 1.10
    max_odds: float = 5.00
    min_minute: int = 65
    max_minute: int = 88
    score_conditions: Dict[str, int] = {"min_diff": 0, "max_total_goals": 10}
    # Profit targets
    min_profit_percent: float = 1.0
    max_profit_percent: float = 5.0
    daily_profit_target: float = 3.0
    
    # Notifications
    enable_sound_alerts: bool = True
    enable_push_notifications: bool = False

    betano_email_encrypted: Optional[str] = None
    betano_password_encrypted: Optional[str] = None

class BetSettingsCreate(BetSettingsBase):
    pass

class BetSettingsSchema(BetSettingsBase):
    id: int
    user_id: int
    created_at: Any
    updated_at: Any
    
    class Config:
        from_attributes = True

# Combo Bet Schemas
class SelectedGame(BaseModel):
    game_id: str
    home: str
    away: str
    bet_type: str  # "UNDER_3.5", "1X2", "BTTS"
    recommendation: str
    odds: float
    confidence: int
    minute: Optional[int] = None
    score: Optional[Dict[str, int]] = None
    direct_link: Optional[str] = None

class ComboBetCreate(BaseModel):
    games: List[SelectedGame]
    bet_amount: float
    total_odds: float
    potential_return: float
    is_simulated: bool = False
    
class ComboBetResponse(BaseModel):
    id: int
    games: List[SelectedGame]
    total_odds: float
    bet_amount: float
    potential_return: float
    status: str
    betano_url: Optional[str] = None
    is_simulated: bool
    created_at: Any
    
    class Config:
        from_attributes = True

# Bet History Schemas
class BetHistoryBase(BaseModel):
    bet_type: str
    games_data: List[Dict[str, Any]]
    total_odds: float
    bet_amount: float
    potential_return: float
    is_simulated: bool = False
    betano_url: Optional[str] = None

class BetHistoryCreate(BetHistoryBase):
    user_id: int

class BetHistorySchema(BetHistoryBase):
    id: int
    user_id: int
    status: str
    result_amount: Optional[float] = None
    created_at: Any
    settled_at: Optional[Any] = None
    
    class Config:
        from_attributes = True

class BetHistoryList(BaseModel):
    bets: List[BetHistorySchema]

class BetStatusUpdate(BaseModel):
    status: str
    result_amount: float = 0

# Alias
User = UserSchema
