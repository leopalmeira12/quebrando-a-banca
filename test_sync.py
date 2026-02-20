"""Quick test: sync 5 rooms to backend"""
import requests
BACKEND = "http://127.0.0.1:5000"

rooms = [
    ("Roleta Brasileira", [15, 22, 33, 4, 18, 7, 30, 12, 25, 1]),
    ("Betano Bulgarian Roulette", [5, 28, 17, 3, 35, 14, 9, 26, 0, 31]),
    ("Speed Roulette", [12, 8, 36, 2, 20, 11, 33, 7, 19, 25]),
    ("Lightning Roulette", [1, 6, 34, 10, 27, 16, 4, 23, 32, 13]),
    ("Auto Roulette VIP", [29, 14, 2, 36, 8, 21, 5, 18, 33, 11]),
]

for name, nums in rooms:
    r = requests.post(f"{BACKEND}/roulette/sync", json={"room_name": name, "numbers": nums}, timeout=5)
    d = r.json()
    print(f"  {name}: D1={d['d1_absence']} D2={d['d2_absence']} D3={d['d3_absence']} | {d['status']}")

s = requests.get(f"{BACKEND}/roulette/status", timeout=5).json()
print(f"\nTotal rooms: {s['total_rooms']}, Threshold: {s['threshold']}")
for room in s["rooms"]:
    print(f"  {room['room_name']}: D1={room['d1_absence']} D2={room['d2_absence']} D3={room['d3_absence']} max={room['max_absence']}")
