import requests
from uuid import UUID

API_URL = "http://127.0.0.1:8001/api"
EMAIL = "admin@odontofocus.com"
PASSWORD = "password123" # Espero que sea este, si no fallará el login
PACIENTE_ID = "b3895e91-4d37-4831-a9ce-bbf331a87b20"

def test_api():
    print(f"Probando API en {API_URL}")
    
    # 1. Login
    try:
        login_res = requests.post(f"{API_URL}/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD
        })
        if login_res.status_code != 200:
            print(f"Error en login: {login_res.status_code} - {login_res.text}")
            # Intentar con password por defecto común
            login_res = requests.post(f"{API_URL}/auth/login", json={
                "email": EMAIL,
                "password": "admin"
            })
            if login_res.status_code != 200:
                print("No se pudo loguear con 'password123' ni 'admin'")
                return
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login exitoso.")
        
        # 2. Get Paciente
        pac_res = requests.get(f"{API_URL}/pacientes/{PACIENTE_ID}", headers=headers)
        print(f"GET /pacientes/{PACIENTE_ID}: {pac_res.status_code}")
        if pac_res.status_code == 200:
            print(f"  Paciente: {pac_res.json().get('nombre')} {pac_res.json().get('apellido')}")
        
        # 3. Get Historias
        hist_res = requests.get(f"{API_URL}/pacientes/{PACIENTE_ID}/historias", headers=headers)
        print(f"GET /pacientes/{PACIENTE_ID}/historias: {hist_res.status_code}")
        if hist_res.status_code == 200:
            print(f"  Historias found: {len(hist_res.json())}")
            for h in hist_res.json():
                print(f"    - ID: {h['id']}, Motivo: {h['motivo_consulta']}, Adjuntos Count: {h.get('adjuntos_count')}")
        else:
            print(f"  Error: {hist_res.text}")

    except Exception as e:
        print(f"Error ejecutando prueba: {e}")

if __name__ == "__main__":
    test_api()
