import sys
import os

# Añadir el directorio actual al path para poder importar la app
sys.path.append(os.getcwd())

from app.database import engine
from sqlmodel import SQLModel
# Importar todos los modelos para que SQLModel los registre
import app.models

if __name__ == "__main__":
    print("Iniciando creación de tablas faltantes...")
    SQLModel.metadata.create_all(engine)
    print("Proceso completado.")
