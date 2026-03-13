import sys
import os
from sqlmodel import Session, select
from sqlalchemy import text

# Añadir el path del backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import engine

def check_admins():
    with Session(engine) as session:
        result = session.execute(text("SELECT id, email, activo FROM sys_config.administradores")).fetchall()
        print(f"Total admins: {len(result)}")
        for r in result:
            print(f"ID: {r.id}, Email: {r.email}, Activo: {r.activo}")

if __name__ == "__main__":
    check_admins()
