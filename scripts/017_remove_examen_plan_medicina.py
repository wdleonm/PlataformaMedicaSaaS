import sys
import os
from sqlmodel import Session, select

# Asegurarse de que pueda importar app desde backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import engine
from app.models.hc_seccion import HCSeccion, EspecialidadHCSeccion
from app.models.especialidad import Especialidad

def remove_examen_plan_medicina():
    codigos_especialidades = ['MED_GEN', 'MED_INT', 'MED_TRA', 'MED_GIN', 'MED_TOX', 'MED_PED']
    codigos_secciones = ['EXAMEN_FISICO', 'PLAN']
    
    with Session(engine) as session:
        # Obtener los IDs de las secciones a remover
        secciones = session.exec(select(HCSeccion).where(HCSeccion.codigo.in_(codigos_secciones))).all()
        secciones_ids = [s.id for s in secciones]
        
        if not secciones_ids:
            print("Las secciones EXAMEN_FISICO y PLAN no existen en db.")
            return

        # Obtener los IDs de las especialidades a modificar
        especialidades = session.exec(select(Especialidad).where(Especialidad.codigo.in_(codigos_especialidades))).all()
        especialidades_ids = [e.id for e in especialidades]

        if not especialidades_ids:
            print("No se encontraron especialidades generales en la db.")
            return

        # Buscar las relaciones en EspecialidadHCSeccion
        relaciones_a_borrar = session.exec(
            select(EspecialidadHCSeccion)
            .where(EspecialidadHCSeccion.especialidad_id.in_(especialidades_ids))
            .where(EspecialidadHCSeccion.hc_seccion_id.in_(secciones_ids))
        ).all()

        if not relaciones_a_borrar:
            print("No se encontraron relaciones para borrar. Las pestañas ya deben estar ocultas.")
            return

        count = len(relaciones_a_borrar)
        for rel in relaciones_a_borrar:
            session.delete(rel)
        
        session.commit()
        print(f"Éxito: Se eliminaron {count} relaciones de secciones (Examen Físico y Plan) para especialidades maestras.")

if __name__ == "__main__":
    remove_examen_plan_medicina()
