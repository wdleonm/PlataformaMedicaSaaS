import sys
import os

# Añadir el path del backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.main import app

def list_routes():
    print("Listing all registered routes:")
    for route in app.routes:
        if hasattr(route, 'path'):
            print(f"{route.methods} {route.path}")

if __name__ == "__main__":
    list_routes()
