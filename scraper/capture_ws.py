"""
WebSocket URL Capture — Betano Roulette
Uses Playwright to open a Betano roulette page and capture the WebSocket URLs
that Evolution Gaming uses to stream live roulette data.

Usage:
  python capture_ws.py

The script will open a visible browser, wait for you to login manually,
then capture the WebSocket URLs and save to ws_urls.json.
"""

import json
import os
import re
import time
from playwright.sync_api import sync_playwright

SAVE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ws_urls.json")

def capture():
    captured_urls = []
    seen = set()

    with sync_playwright() as p:
        # Launch visible browser so user can login manually
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        def on_websocket(ws):
            url = ws.url
            # Evolution Gaming WebSocket patterns
            # Common patterns: wss://*/public/roulette/*, wss://*/game/*, wss://*evo-games*
            if url in seen:
                return
            seen.add(url)

            is_relevant = False
            # Check for Evolution Gaming / roulette WebSocket patterns
            patterns = [
                "evo-games",
                "evo.",
                "evolution",
                "roulette",
                "game/player",
                "public/roulette",
                "gamelaunch",
                "pragmatic",
                "livecasino",
                "socket"
            ]
            for pat in patterns:
                if pat in url.lower():
                    is_relevant = True
                    break

            if is_relevant:
                print(f"\n{'='*60}")
                print(f"  WEBSOCKET CAPTURED!")
                print(f"  URL: {url[:120]}...")
                print(f"{'='*60}\n")
                captured_urls.append(url)
                save_urls(captured_urls)

            # Log ALL WebSocket connections for debugging
            print(f"[WS] {url[:100]}")

        def on_ws_message(ws):
            def handle_msg(msg):
                # Only log first 200 chars of messages that contain roulette data
                if isinstance(msg, str) and len(msg) < 2000:
                    lower = msg.lower()
                    if "result" in lower or "roulette" in lower or "recentresult" in lower:
                        print(f"[MSG] {msg[:200]}")
            return handle_msg

        page.on("websocket", on_websocket)

        # Navigate to Betano
        print("\n" + "="*60)
        print("  BETANO WEBSOCKET CAPTURE")
        print("="*60)
        print("\n1. A browser window will open")
        print("2. LOGIN to your Betano account")
        print("3. Navigate to a ROULETTE table")
        print("4. Wait ~30 seconds for WebSocket URLs to be captured")
        print("5. The URLs will be saved automatically to ws_urls.json")
        print("\nOpening Betano...")

        page.goto("https://betano.bet.br/casino/games/roleta-brasileira/11583/tables/")
        print("\nPage loaded. Please LOGIN if needed.")
        print("Then click on any roulette room to trigger WebSocket connections.\n")
        print("Waiting for WebSocket connections... (press Ctrl+C to stop)\n")

        try:
            # Keep running and capturing
            while True:
                time.sleep(2)
                if captured_urls:
                    print(f"\rCaptured {len(captured_urls)} WebSocket URL(s)", end="", flush=True)
        except KeyboardInterrupt:
            print(f"\n\nDone! Captured {len(captured_urls)} WebSocket URL(s)")

        browser.close()

    return captured_urls


def save_urls(urls):
    """Save captured URLs to JSON file"""
    data = {
        "captured_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "count": len(urls),
        "urls": urls
    }
    with open(SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  [SAVED] {len(urls)} URLs → {SAVE_PATH}")


if __name__ == "__main__":
    capture()
