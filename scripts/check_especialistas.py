import sys
import os
from sqlmodel import Session, select
from sqlalchemy import text

# Añadir el path del backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import engine

def check_especialistas():
    with Session(engine) as session:
        result = session.execute(text("SELECT id, email, nombre, apellido, plan_suscripcion_id FROM sys_config.especialistas")).fetchall()
        print(f"Total especialistas: {len(result)}")
        for r in result:
            print(f"ID: {r.id}, Email: {r.email}, Nombre: {r.nombre}, Apellido: {r.apellido}, PlanID: {r.plan_suscripcion_id}")

if __name__ == "__main__":
    check_especialistas()
