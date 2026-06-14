import sys
import os

sys.path.append(os.path.abspath("backend"))
from app.database import engine
from sqlmodel import Session, select
from app.models.paciente import Paciente

with Session(engine) as session:
    pacientes = session.exec(select(Paciente)).all()
    for p in pacientes:
        print(f"ID={p.id}, Nombre={p.nombre} {p.apellido}, Activo={p.activo}")
