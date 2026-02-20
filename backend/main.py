import os
import json
import re
import datetime
import base64
import io
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ── OCR ENGINE ──
try:
    from rapidocr_onnxruntime import RapidOCR
    from PIL import Image
    ocr_engine = RapidOCR()
    print("[AI] RapidOCR Engine LOADED OK")
except Exception as e:
    ocr_engine = None
    print(f"[AI] OCR não disponível: {e}")

app = FastAPI(title="Dozen Tracker AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DATABASE ──
DB_URL = "sqlite:///./roulette_history.db"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class RouletteRoom(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    zigzag_count = Column(Integer, default=0)
    last_dozen = Column(Integer, default=-1)
    history = Column(Text, default="[]")
    last_update = Column(DateTime, default=datetime.datetime.utcnow)

class RouletteResult(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True)
    room_name = Column(String)
    number = Column(Integer)
    dozen = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class TrackerConfig(Base):
    __tablename__ = "config"
    id = Column(Integer, primary_key=True)
    threshold = Column(Integer, default=6)

Base.metadata.create_all(bind=engine)

# ── MODELS ──
class SyncData(BaseModel):
    room_name: str
    numbers: List[int]

class ConfigUpdate(BaseModel):
    threshold: int

class FrameData(BaseModel):
    image: str

# ── CORE LOGIC ──
def get_dozen(n):
    if n == 0: return 0
    if 1 <= n <= 12: return 1
    if 13 <= n <= 24: return 2
    if 25 <= n <= 36: return 3
    return 0

def merge_sequences(old_seq, new_seq):
    if not old_seq: return new_seq
    if not new_seq: return old_seq
    
    n_len = len(new_seq)
    for i in range(len(old_seq) - n_len + 1):
        if old_seq[i:i+n_len] == new_seq:
            return old_seq
            
    max_overlap = 0
    for i in range(1, min(len(old_seq), len(new_seq)) + 1):
        if old_seq[-i:] == new_seq[:i]:
            max_overlap = i
            
    if max_overlap > 0:
        return old_seq + new_seq[max_overlap:]
        
    return old_seq + new_seq

def process_numbers(db, name, numbers):
    room = db.query(RouletteRoom).filter(RouletteRoom.name == name).first()
    if not room:
        room = RouletteRoom(name=name, history="[]", zigzag_count=0, last_dozen=-1)
        db.add(room)
        db.commit()

    if not numbers:
        return room.zigzag_count

    old_history = []
    if room.history:
        try:
            old_history = json.loads(room.history)
        except:
            pass
            
    merged = merge_sequences(old_history, numbers)
    # Keep last 25 to prevent infinite db bloat
    merged = merged[-25:]
    
    count = 0
    last_doz = -1
    
    for n in merged:
        doz = get_dozen(n)
        if doz == 0:
            count = 0
            last_doz = 0
            continue
            
        if last_doz in (-1, 0, doz):
            count = 1
        else:
            count += 1
            
        last_doz = doz
        
    room.zigzag_count = count
    room.last_dozen = last_doz
    room.history = json.dumps(merged)
    room.last_update = datetime.datetime.utcnow()
    db.commit()
    
    return room.zigzag_count

# ── AI VISION: Extract numbers from screenshot ──
def process_screenshot(base64_image):
    if not ocr_engine:
        return [], []
    
    try:
        if "," in base64_image:
            base64_image = base64_image.split(",", 1)[1]
        
        image_data = base64.b64decode(base64_image)
        img = Image.open(io.BytesIO(image_data))
        
        import numpy as np
        img_array = np.array(img)
        
        result, _ = ocr_engine(img_array)
        
        if not result:
            return [], []
        
        # Parse OCR results
        num_pattern = re.compile(r'^\s*(\d{1,2})\s*$')
        ignore_kw = re.compile(r'(\$|r\$|saldo|aposta|dealer|crupier|betano|live|limite)', re.IGNORECASE)
        
        rooms_found = []
        nums_found = []
        
        for item in result:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                text = str(item[1]).strip()
                bbox = item[0]
                if not isinstance(bbox, (list, tuple)) or len(bbox) < 4: continue
                
                x_center = (bbox[0][0] + bbox[1][0]) / 2
                y_center = (bbox[0][1] + bbox[2][1]) / 2
                
                match = num_pattern.match(text)
                if match:
                    val = int(match.group(1))
                    if 0 <= val <= 36:
                        nums_found.append({"val": val, "x": x_center, "y": y_center})
                elif len(text) >= 4 and not ignore_kw.search(text):
                    # It's not a number, not an ignored UI word, so it must be a Room Title or part of it
                    rooms_found.append({"name": text, "x": x_center, "y": y_center, "numbers": []})
        
        # Failsafe: if inside a game room, OCR might just find numbers but no clear title
        if len(rooms_found) == 0 and len(nums_found) > 0:
            rooms_found.append({"name": "Current Room", "x": 0, "y": 0, "numbers": []})

        # Map numbers to their closest room
        for num in nums_found:
            closest_room = None
            min_dist = 9999999
            for room in rooms_found:
                # Euclidean distance squared
                dist = (num["x"] - room["x"])**2 + (num["y"] - room["y"])**2
                if dist < min_dist:
                    min_dist = dist
                    closest_room = room
                    
            # Threshold: increased to 400px squared handle large 4K cards
            if closest_room and (min_dist < 400**2 or len(rooms_found) == 1):
                closest_room["numbers"].append(num)
                
        all_alerts = []
        all_rooms_data = []
        db = SessionLocal()
        cfg = db.query(TrackerConfig).first()
        threshold = cfg.threshold if cfg else 6
        
        # Process each room with its specific aligned numbers
        for room in rooms_found:
            room_name = room["name"]
            # Sort numbers physically left-to-right as requested!
            room["numbers"].sort(key=lambda n: n["x"])
            ordered_vals = [n["val"] for n in room["numbers"]]
            
            if ordered_vals:
                count = process_numbers(db, room_name, ordered_vals)
                
                room_info = {"room_name": room_name, "zigzag": count or 0}
                all_rooms_data.append(room_info)
                
                if count and count >= threshold:
                    all_alerts.append({"room": room_name, "absence": count})
                    print(f"[AI-ALERT] 🎯 {room_name}: zigzag={count} (Threshold: {threshold}) | Sequence: {ordered_vals}")
            
        print(f"[AI-OCR] Detected {len(rooms_found)} rooms and {len(nums_found)} numbers.")
        
        db.close()
        return all_alerts, all_rooms_data
        
    except Exception as e:
        print(f"[AI-OCR] Error: {e}")
        return [], []

# ── ENDPOINTS ──

@app.post("/roulette/vision")
async def vision_api(data: FrameData):
    alerts, rooms_data = process_screenshot(data.image)
    return {"status": "processed", "alerts": alerts, "rooms": rooms_data}

@app.post("/roulette/sync")
async def sync(data: SyncData):
    db = SessionLocal()
    count = process_numbers(db, data.room_name, data.numbers)
    cfg = db.query(TrackerConfig).first()
    threshold = cfg.threshold if cfg else 6
    alert = {"room": data.room_name, "absence": count} if count and count >= threshold else None
    db.close()
    return {"status": "ok", "zigzag": count or 0, "threshold": threshold, "alerts": [alert] if alert else []}

@app.get("/roulette/status")
async def get_status():
    db = SessionLocal()
    rooms = db.query(RouletteRoom).filter(RouletteRoom.zigzag_count > 0).all()
    cfg = db.query(TrackerConfig).first()
    threshold = cfg.threshold if cfg else 6
    data = [{"room_name": r.name, "zigzag": r.zigzag_count, "last_numbers": json.loads(r.history)} for r in rooms]
    db.close()
    return {"rooms": data, "threshold": threshold}

@app.get("/roulette/history")
async def get_history(limit: int = 100):
    db = SessionLocal()
    results = db.query(RouletteResult).order_by(RouletteResult.timestamp.desc()).limit(limit).all()
    data = [{"room": r.room_name, "num": r.number, "dozen": r.dozen, "time": str(r.timestamp)} for r in results]
    db.close()
    return {"history": data}

@app.get("/roulette/config")
async def get_cfg():
    db = SessionLocal()
    cfg = db.query(TrackerConfig).first()
    db.close()
    return {"threshold": cfg.threshold if cfg else 6}

@app.post("/roulette/config")
async def set_cfg(data: ConfigUpdate):
    db = SessionLocal()
    cfg = db.query(TrackerConfig).first()
    if not cfg:
        cfg = TrackerConfig(threshold=data.threshold)
        db.add(cfg)
    else:
        cfg.threshold = data.threshold
    db.commit()
    db.close()
    return {"status": "ok"}

@app.post("/roulette/reset")
async def reset_data():
    db = SessionLocal()
    db.query(RouletteRoom).delete()
    db.query(RouletteResult).delete()
    db.commit()
    db.close()
    return {"status": "ok", "message": "All data cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
