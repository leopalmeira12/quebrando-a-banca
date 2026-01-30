
import requests
import json

BASE_URL = "http://127.0.0.1:8000"
ORIGIN = "http://localhost:3000"

def test_cors_and_auth():
    print(f"Testing CORS and Auth against {BASE_URL} with Origin {ORIGIN}")

    # 1. Test CORS Preflight (OPTIONS)
    print("\n[1] Testing CORS Preflight (OPTIONS /register)...")
    try:
        response = requests.options(
            f"{BASE_URL}/register",
            headers={
                "Origin": ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
        )
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {json.dumps(dict(response.headers), indent=2)}")
        
        if "Access-Control-Allow-Origin" in response.headers and response.headers["Access-Control-Allow-Origin"] == ORIGIN:
             print("✅ CORS Preflight passed: Access-Control-Allow-Origin is correct.")
        else:
             print("❌ CORS Preflight failed: Access-Control-Allow-Origin missing or incorrect.")
             
        if "Access-Control-Allow-Credentials" in response.headers and response.headers["Access-Control-Allow-Credentials"] == "true":
             print("✅ CORS Preflight passed: Access-Control-Allow-Credentials is correct.")
        else:
             print("❌ CORS Preflight failed: Access-Control-Allow-Credentials missing or incorrect.")

    except Exception as e:
        print(f"❌ Error during Preflight test: {str(e)}")

    # 2. Test Register (POST)
    print("\n[2] Testing Register (POST /register)...")
    email = "test_user_cors@example.com"
    password = "password123"
    
    try:
        response = requests.post(
            f"{BASE_URL}/register",
            json={"email": email, "password": password, "confirm_password": password},
            headers={"Origin": ORIGIN}
        )
        # 400 is acceptable if user already exists
        if response.status_code in [200, 201, 400]:
             print(f"✅ Register request made. Status: {response.status_code}")
             if response.status_code == 400 and "Email already registered" in response.text:
                 print("   (User already exists, proceeding to login)")
        else:
             print(f"❌ Register failed with unexpected status: {response.status_code}")
             print(response.text)
    except Exception as e:
        print(f"❌ Error during Register test: {str(e)}")

    # 3. Test Login (POST)
    print("\n[3] Testing Login (POST /token)...")
    token = None
    try:
        response = requests.post(
            f"{BASE_URL}/token",
            data={"username": email, "password": password},
            headers={"Origin": ORIGIN}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✅ Login successful. Token received.")
            
            # Check CORS headers on actual response
            if response.headers.get("Access-Control-Allow-Origin") == ORIGIN:
                 print("✅ Login CORS passed: Access-Control-Allow-Origin is correct.")
            else:
                 print(f"❌ Login CORS failed. Headers: {response.headers}")

        else:
            print(f"❌ Login failed. Status: {response.status_code}")
            print(response.text)
            return

    except Exception as e:
        print(f"❌ Error during Login test: {str(e)}")
        return

    # 4. Test Protected Route (GET /users/me)
    if token:
        print("\n[4] Testing Protected Route (GET /users/me)...")
        try:
            response = requests.get(
                f"{BASE_URL}/users/me",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Origin": ORIGIN
                }
            )
            
            if response.status_code == 200:
                print(f"✅ Protected route access successful.")
                print(f"User data: {response.json()}")
                 # Check CORS headers
                if response.headers.get("Access-Control-Allow-Origin") == ORIGIN:
                     print("✅ Protected Route CORS passed: Access-Control-Allow-Origin is correct.")
                else:
                     print(f"❌ Protected Route CORS failed. Headers: {response.headers}")
            else:
                print(f"❌ Protected route failed. Status: {response.status_code}")
                print(response.text)

        except Exception as e:
            print(f"❌ Error during Protected Route test: {str(e)}")

if __name__ == "__main__":
    test_cors_and_auth()
