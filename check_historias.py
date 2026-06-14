import sys
import os

sys.path.append(os.path.abspath("backend"))
from app.database import engine
from sqlmodel import Session, select
from app.models.historia_clinica import HistoriaClinica
from app.models.paciente import Paciente

with Session(engine) as session:
    historias = session.exec(select(HistoriaClinica)).all()
    for h in historias:
        paciente = session.exec(select(Paciente).where(Paciente.id == h.paciente_id)).first()
        pac_nombre = f"{paciente.nombre} {paciente.apellido}" if paciente else str(h.paciente_id)
        print(f"ID={h.id}, Paciente={pac_nombre}, Activo={h.activo}, Fecha={h.fecha_apertura}")
