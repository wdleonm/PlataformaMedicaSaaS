import http.client
import json

def test_actual_server():
    conn = http.client.HTTPConnection("127.0.0.1", 8001)
    
    # Probamos el endpoint de especialidades
    # Necesita token de admin, pero debería dar 401 si existe, no 404.
    conn.request("GET", "/api/admin/config/especialidades")
    r1 = conn.getresponse()
    print(f"Status Especialidades: {r1.status}")
    print(f"Data: {r1.read().decode()}")
    
    # Probamos un endpoint que sabemos que existe
    conn.request("GET", "/health")
    r2 = conn.getresponse()
    print(f"Status Health: {r2.status}")
    print(f"Data: {r2.read().decode()}")

if __name__ == "__main__":
    test_actual_server()
