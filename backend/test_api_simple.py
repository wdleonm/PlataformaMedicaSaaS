import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8001/api"
EMAIL = "admin@odontofocus.com"
PASSWORD = "123456" # Encontrado en test_api.py
PACIENTE_ID = "b3895e91-4d37-4831-a9ce-bbf331a87b20"

def call_api(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.data = json.dumps(data).encode("utf-8")
    
    try:
        with urllib.request.urlopen(req) as res:
            return res.getcode(), json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")
    except Exception as e:
        return 0, str(e)

def test():
    print("Iniciando prueba...")
    # 1. Login
    code, res = call_api("/auth/login", "POST", {"email": EMAIL, "password": PASSWORD})
    if code != 200:
        print(f"Login falló con 'admin', probando 'password123'...")
        code, res = call_api("/auth/login", "POST", {"email": EMAIL, "password": "password123"})
    
    if code != 200:
        print(f"Error login: {code} - {res}")
        return

    token = res["access_token"]
    print("Login exitoso.")

    # 2. Get Paciente
    code, res = call_api(f"/pacientes/{PACIENTE_ID}", token=token)
    print(f"GET /pacientes/{PACIENTE_ID}: {code}")
    if code == 200:
        print(f"  Paciente: {res['nombre']} {res['apellido']}")

    # 3. Get Historias
    code, res = call_api(f"/pacientes/{PACIENTE_ID}/historias", token=token)
    print(f"GET /pacientes/{PACIENTE_ID}/historias: {code}")
    if code == 200:
        print(f"  Historias: {len(res)}")
    else:
        print(f"  Error: {res}")

if __name__ == "__main__":
    test()
