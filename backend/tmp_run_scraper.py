import sys
import os

# Ensure current directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.blue_dental_sync import sync_bluedental_catalogo

print("Iniciando sincronización manual...")
total = sync_bluedental_catalogo()
print("Sincronización terminada. Items procesados:", total)
