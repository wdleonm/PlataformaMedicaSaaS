import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.abspath("backend"))

from app.database import engine
from sqlmodel import Session, select
from app.models.odontograma import OdontogramaRegistro

with Session(engine) as session:
    stmt = select(OdontogramaRegistro).where(
        OdontogramaRegistro.paciente_id == "825cf73b-4dcb-441d-a7c9-5d298fc12c2d"
    )
    records = session.exec(stmt).all()
    for r in records:
        print(f"Record: ID={r.id}, Fecha={r.fecha_registro}, Diente={r.numero_diente}")
