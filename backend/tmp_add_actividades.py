from sqlmodel import Session, select
from app.database import engine
from app.models.hc_seccion import HCSeccion, EspecialidadHCSeccion
from app.models.especialidad import Especialidad

def add_actividades_section():
    with Session(engine) as session:
        # Check if ACTIVIDADES exists
        act_seccion = session.exec(select(HCSeccion).where(HCSeccion.codigo == "ACTIVIDADES")).first()
        if not act_seccion:
            act_seccion = HCSeccion(
                codigo="ACTIVIDADES",
                nombre="Actividades Realizadas",
                componente_frontend="ActividadesStep",
                activo=True
            )
            session.add(act_seccion)
            session.commit()
            session.refresh(act_seccion)
            print("Sección ACTIVIDADES creada.")
        else:
            print("Sección ACTIVIDADES ya existía.")

        # Get all specialties
        especialidades = session.exec(select(Especialidad)).all()
        
        # For each specialty, check if it has the ACTIVIDADES section
        for esp in especialidades:
            link = session.exec(
                select(EspecialidadHCSeccion)
                .where(
                    EspecialidadHCSeccion.especialidad_id == esp.id,
                    EspecialidadHCSeccion.hc_seccion_id == act_seccion.id
                )
            ).first()
            
            if not link:
                # Add it at order 6
                link = EspecialidadHCSeccion(
                    especialidad_id=esp.id,
                    hc_seccion_id=act_seccion.id,
                    orden=6,
                    obligatoria=False
                )
                session.add(link)
                
                # Make sure ADJUNTOS is order 7
                adjunto_sec = session.exec(select(HCSeccion).where(HCSeccion.codigo == "ADJUNTOS")).first()
                if adjunto_sec:
                    adjunto_link = session.exec(
                        select(EspecialidadHCSeccion)
                        .where(
                            EspecialidadHCSeccion.especialidad_id == esp.id,
                            EspecialidadHCSeccion.hc_seccion_id == adjunto_sec.id
                        )
                    ).first()
                    if adjunto_link:
                        adjunto_link.orden = 7
                        session.add(adjunto_link)
        
        session.commit()
        print("Enlaces de sección actualizados.")

if __name__ == "__main__":
    add_actividades_section()
