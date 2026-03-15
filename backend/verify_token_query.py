import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8001/api"
EMAIL = "admin@odontofocus.com"
PASSWORD = "123456"

def test_token_query():
    # 1. Login to get token
    login_url = f"{BASE_URL}/auth/login"
    data = json.dumps({"email": EMAIL, "password": PASSWORD}).encode("utf-8")
    req = urllib.request.Request(login_url, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as res:
            token = json.loads(res.read().decode("utf-8"))["access_token"]
            print("Login exitoso.")
    except Exception as e:
        print(f"Error en login: {e}")
        return

    # 2. Test /api/auth/me with token in query param
    me_url = f"{BASE_URL}/auth/me?token={token}"
    print(f"Probando {BASE_URL}/auth/me?token=...")
    
    req_me = urllib.request.Request(me_url)
    try:
        with urllib.request.urlopen(req_me) as res:
            print(f"Resultado: {res.getcode()}")
            print(f"Usuario: {json.loads(res.read().decode('utf-8'))['email']}")
            print("VERIFICACION EXITOSA: El backend acepta el token en la query.")
    except urllib.error.HTTPError as e:
        print(f"FALLO HTTP {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"FALLO: {e}")

if __name__ == "__main__":
    test_token_query()
