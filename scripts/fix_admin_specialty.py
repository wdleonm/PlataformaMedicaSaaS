import sys
import os
from sqlmodel import Session, select
from uuid import UUID

# Path backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import engine
from app.models.especialista import Especialista, EspecialistaEspecialidad
from app.models.especialidad import Especialidad

def fix_admin_specialty():
    with Session(engine) as session:
        # 1. Buscar Admin Principal
        admin_esp = session.exec(select(Especialista).where(Especialista.email == "admin@odontofocus.com")).first()
        if not admin_esp:
            print("No se encontró al especialista admin@odontofocus.com")
            return

        # 2. Buscar Odontología General
        odontologia = session.exec(select(Especialidad).where(Especialidad.nombre == "Odontología General")).first()
        if not odontologia:
            print("No se encontró la especialidad Odontología General")
            return

        # 3. Verificar si ya existe la relación
        existing = session.exec(
            select(EspecialistaEspecialidad)
            .where(EspecialistaEspecialidad.especialista_id == admin_esp.id)
            .where(EspecialistaEspecialidad.especialidad_id == odontologia.id)
        ).first()

        if not existing:
            new_rel = EspecialistaEspecialidad(
                especialista_id=admin_esp.id,
                especialidad_id=odontologia.id
            )
            session.add(new_rel)
            session.commit()
            print(f"Éxito: Especialidad Odontología General asociada a {admin_esp.email}")
        else:
            print(f"El especialista {admin_esp.email} ya tiene la especialidad asociada.")

if __name__ == "__main__":
    fix_admin_specialty()
