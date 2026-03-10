import requests

resp = requests.post("http://127.0.0.1:8001/api/auth/login", json={"email": "admin@odontofocus.com", "password": "123456"})
token = resp.json().get("access_token")
if token:
    res = requests.get("http://127.0.0.1:8001/api/pacientes", headers={"Authorization": f"Bearer {token}"})
    print("STATUS:", res.status_code)
    print("DATA:", res.json())
else:
    print("No token", resp.text)
