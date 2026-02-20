# Roulette Dozen Absence Tracker — Implementation Plan

## Overview
Chrome Extension + Python Backend that monitors all visible roulette rooms on Betano's listing page,
tracking how many consecutive rounds each dozen (D1: 1-12, D2: 13-24, D3: 25-35) has been absent.
Emits alerts when a configurable threshold is reached.

## Architecture

### Extension (Chrome Manifest V3)
- **content.js** — Scrapes all roulette room cards from the listing page
  - Extracts room name + last drawn numbers from each card
  - Sends data to background.js via chrome.runtime.sendMessage
  - Polls every 5 seconds for new numbers
- **background.js** — Bridge between content script and backend
  - Forwards scraped data to backend API
  - Receives alerts from backend and triggers Chrome notifications
  - Manages alarm-based periodic polling
- **popup.html/popup.js** — Configuration + Live Dashboard
  - Configure absence threshold (e.g., alert after X rounds without a dozen)
  - Live view of all rooms with current absence counts per dozen
  - History of alerts and outcomes (how many more rounds until dozen returned)

### Backend (Python FastAPI)
- **Endpoints:**
  - `POST /roulette/sync` — Receive room data (room_name, numbers[])
  - `GET /roulette/status` — Get absence status for all rooms
  - `GET /roulette/alerts` — Get active alerts above threshold
  - `GET /roulette/history` — Get historical metrics
  - `POST /roulette/config` — Set threshold
- **Database (SQLite):**
  - `roulette_rooms` — Room tracking
  - `roulette_results` — Per-room number history
  - `roulette_alerts` — Alert history with outcome tracking

## Dozen Logic
- D1 = numbers 1-12
- D2 = numbers 13-24
- D3 = numbers 25-35 (note: roulette goes to 36, but user specified 35)
- Zero (0) = belongs to no dozen
- For each room, track consecutive absence of each dozen independently

## Files to Create/Modify
1. `extension/manifest.json` — Update for roulette
2. `extension/content.js` — New roulette scraper
3. `extension/background.js` — New bridge logic
4. `extension/popup.html` — New dashboard UI
5. `extension/popup.js` — New popup logic
6. `backend/main.py` — New roulette endpoints
7. `backend/requirements.txt` — Update if needed
