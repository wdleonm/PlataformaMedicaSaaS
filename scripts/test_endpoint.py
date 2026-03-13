import requests

def test_endpoint():
    # El backend corre en 127.0.0.1:8001 (según logs de terminal)
    # Sin embargo, el login de admin necesita token.
    # Pero para probar si la ruta existe (independiente del 401), podemos ver si da 401 o 404.
    
    url = "http://127.0.0.1:8001/api/admin/especialistas/especialidades/all"
    try:
        response = requests.get(url)
        print(f"URL: {url}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoint()
