import sys
import os
from sqlmodel import Session, select
from sqlalchemy import text

# Añadir el path del backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import engine

def check_especialidades():
    with Session(engine) as session:
        result = session.execute(text("SELECT id, nombre, activo FROM sys_config.especialidades")).fetchall()
        print(f"Total especialidades: {len(result)}")
        for r in result:
            print(f"ID: {r.id}, Nombre: {r.nombre}, Activo: {r.activo}")

if __name__ == "__main__":
    check_especialidades()
