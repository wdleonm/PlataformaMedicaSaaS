import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.abspath("backend"))

from app.database import engine
from sqlmodel import Session, delete
from app.models.odontograma import OdontogramaRegistro

with Session(engine) as session:
    stmt = delete(OdontogramaRegistro).where(
        OdontogramaRegistro.paciente_id == "825cf73b-4dcb-441d-a7c9-5d298fc12c2d"
    )
    result = session.exec(stmt)
    session.commit()
    print(f"Deleted {result.rowcount} orphaned odontograma records.")
