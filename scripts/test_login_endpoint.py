import requests

def test_login():
    url = "http://127.0.0.1:8001/api/auth/login"
    payload = {
        "email": "admin@odontofocus.com",
        "password": "123456"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
