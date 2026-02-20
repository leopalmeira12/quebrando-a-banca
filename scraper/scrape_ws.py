"""
Roulette WebSocket Scraper — Betano/Evolution Gaming
Connects to roulette WebSockets and captures results in real-time.
Sends data to the backend for dozen absence tracking.

Usage:
  python scrape_ws.py           # Uses saved WebSocket URLs
  python scrape_ws.py --capture # First captures URLs, then scrapes
"""

import json
import os
import sys
import time
import threading
import requests
import websocket

BACKEND_URL = "http://127.0.0.1:5000"
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
WS_URLS_FILE = os.path.join(DATA_DIR, "ws_urls.json")

# Known Evolution Gaming roulette IDs (common across platforms)
ROLETA_IDS = {
    "PorROU0000000001": "Roleta Ao Vivo",
    "7x0b1tgh7agmf6hv": "Immersive Roulette",
    "vctlz20yfnmp1ylr": "Roulette",
    "48z5pjps3ntvqc1b": "Auto Roulette",
    "lkcbrbdckjxajdol": "Speed Roulette",
    "wzg6kdkad1oe7m5k": "VIP Roulette",
    "01rb77cq1gtenhmo": "Auto Roulette VIP",
    "DoubleBallRou001": "Double Ball Roulette",
    "f1f4rm9xgh4j3u2z": "Auto Roulette La Partage",
    "7nyiaws9tgqrzaz3": "Football Studio Roulette",
    "lr6t4k3lcd4qgyrk": "Grand Casino Roulette",
    "mrpuiwhx5slaurcy": "Hippodrome Grand Casino",
    "mvrcophqscoqosd6": "Casino Malta Roulette",
    "RedDoorRoulette1": "Red Door Roulette",
}


def get_dozen(number):
    """Return dozen (0=zero, 1=D1, 2=D2, 3=D3)"""
    if number == 0:
        return 0
    elif 1 <= number <= 12:
        return 1
    elif 13 <= number <= 24:
        return 2
    elif 25 <= number <= 36:
        return 3
    return 0


def sync_to_backend(room_name, numbers):
    """Send room data to backend"""
    try:
        resp = requests.post(
            f"{BACKEND_URL}/roulette/sync",
            json={"room_name": room_name, "numbers": numbers},
            timeout=5
        )
        data = resp.json()
        d1 = data.get("d1_absence", 0)
        d2 = data.get("d2_absence", 0)
        d3 = data.get("d3_absence", 0)
        alerts = data.get("alerts", [])

        status_icon = "🔴" if alerts else "✅"
        print(f"  {status_icon} {room_name}: D1={d1} D2={d2} D3={d3} nums={numbers[:5]}")

        for alert in alerts:
            print(f"  🚨 SINAL! {alert['room']} — {alert['dozen']} ({alert['absence']} rodadas)")

        return data
    except Exception as e:
        print(f"  ❌ Sync failed for {room_name}: {e}")
        return None


def scrape_roulette(ws_base_url, roleta_id, room_name, results_store):
    """Connect to a single roulette WebSocket and process results"""
    url = ws_base_url.replace("{id_roleta}", roleta_id)
    reconnect_attempts = 0
    max_attempts = 10

    while reconnect_attempts < max_attempts:
        try:
            ws = websocket.WebSocket()
            ws.settimeout(30)
            ws.connect(url)
            print(f"  🔌 Connected to {room_name} ({roleta_id})")

            while True:
                msg = ws.recv()
                if not msg:
                    continue

                try:
                    data = json.loads(msg)
                except json.JSONDecodeError:
                    continue

                # Evolution Gaming sends roulette results in this format
                msg_type = data.get("type", "")

                if msg_type == "roulette.recentResults":
                    results = data.get("args", {}).get("recentResults", [])
                    # Flatten nested arrays
                    flat = []
                    for item in results:
                        if isinstance(item, list):
                            flat.extend(item)
                        else:
                            flat.append(item)

                    numbers = [int(x) for x in flat if str(x).isdigit() and int(x) <= 36]

                    if numbers:
                        old = results_store.get(roleta_id, [])
                        if numbers != old:
                            results_store[roleta_id] = numbers
                            sync_to_backend(room_name, numbers[:15])

                    ws.close()
                    return True

                # Also check for individual result updates
                elif msg_type in ("roulette.result", "roulette.gameResult"):
                    result_data = data.get("args", {})
                    number = result_data.get("result", result_data.get("number"))
                    if number is not None:
                        number = int(number)
                        old = results_store.get(roleta_id, [])
                        new_numbers = [number] + old[:14]
                        results_store[roleta_id] = new_numbers
                        sync_to_backend(room_name, new_numbers)

        except websocket.WebSocketTimeoutException:
            print(f"  ⏰ Timeout for {room_name}, reconnecting...")
            reconnect_attempts += 1
        except Exception as e:
            print(f"  ❌ Error for {room_name}: {e}")
            reconnect_attempts += 1
            time.sleep(2)

    print(f"  ❌ Failed to connect to {room_name} after {max_attempts} attempts")
    return False


def main_loop(ws_base_url):
    """Main scraping loop — cycles through all roulettes"""
    results_store = {}
    cycle = 0

    print("\n" + "=" * 60)
    print("  ROULETTE WEBSOCKET SCRAPER — LIVE")
    print("=" * 60)
    print(f"  Base URL: {ws_base_url[:80]}...")
    print(f"  Roulettes: {len(ROLETA_IDS)}")
    print(f"  Backend: {BACKEND_URL}")
    print("=" * 60 + "\n")

    while True:
        cycle += 1
        print(f"\n{'─'*40}")
        print(f"  Cycle #{cycle} — {time.strftime('%H:%M:%S')}")
        print(f"{'─'*40}")

        for roleta_id, room_name in ROLETA_IDS.items():
            try:
                scrape_roulette(ws_base_url, roleta_id, room_name, results_store)
            except Exception as e:
                print(f"  ❌ {room_name}: {e}")
                continue

        print(f"\n  📊 Cycle #{cycle} complete. {len(results_store)} rooms with data.")
        print(f"  Waiting 5s before next cycle...")
        time.sleep(5)


def load_ws_urls():
    """Load saved WebSocket URLs"""
    if not os.path.exists(WS_URLS_FILE):
        return None

    with open(WS_URLS_FILE, "r") as f:
        data = json.load(f)

    urls = data.get("urls", [])
    if not urls:
        return None

    # Find a URL that can be used as template (contains game ID that we can replace)
    for url in urls:
        # Try to find and templatize the game ID in the URL
        for roleta_id in ROLETA_IDS:
            if roleta_id in url:
                template = url.replace(roleta_id, "{id_roleta}")
                print(f"  Found template URL from {roleta_id}")
                return template

    # If no exact match, try pattern matching
    # Evolution URLs typically look like: wss://host/public/roulette/player/game/GAMEID/socket
    import re
    for url in urls:
        match = re.search(r"(game/)[^/]+(/.+)", url)
        if match:
            template = re.sub(r"(game/)[^/]+(/.+)", r"\1{id_roleta}\2", url)
            return template

    # Return first URL as-is if no pattern found
    print(f"  ⚠️ Could not templatize URL, using first one directly")
    return urls[0]


if __name__ == "__main__":
    if "--capture" in sys.argv:
        print("Starting WebSocket URL capture...")
        from capture_ws import capture
        capture()

    ws_url = load_ws_urls()

    if not ws_url:
        print("\n❌ No WebSocket URLs found!")
        print("\nYou need to capture URLs first:")
        print("  1. Run: python capture_ws.py")
        print("  2. Login to Betano in the browser that opens")
        print("  3. Click on a roulette room")
        print("  4. Wait for URLs to be captured")
        print("  5. Press Ctrl+C when done")
        print("  6. Then run this script again: python scrape_ws.py")
        sys.exit(1)

    print(f"\n  WebSocket URL template: {ws_url[:80]}...")
    main_loop(ws_url)
