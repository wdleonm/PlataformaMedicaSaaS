from uuid import UUID
from sqlmodel import Session, select, func, text
from app.database import engine
from app.models.historia_clinica import HistoriaClinica, HistoriaClinicaAdjunto
from app.models.paciente import Paciente
from app.models.especialista import Especialista

especialista_id = UUID("c0943115-4691-4413-97fa-1efa21723b51")
paciente_id = UUID("b3895e91-4d37-4831-a9ce-bbf331a87b20")

def debug_api_logic():
    with Session(engine) as session:
        print(f"Simulando especialista_id: {especialista_id}")
        print(f"Consultando paciente_id: {paciente_id}")
        
        # Simular RLS (esto es lo que hace el backend)
        try:
            session.exec(text(f"SET LOCAL app.especialista_id = '{especialista_id}'"))
            print("RLS context set.")
        except Exception as e:
            print(f"Error setting RLS context: {e}")

        # 1. Verificar Paciente
        paciente = session.exec(
            select(Paciente).where(
                Paciente.id == paciente_id,
                Paciente.especialista_id == especialista_id,
            )
        ).first()
        print(f"PASO 1 (Verificar Paciente): {'ENCONTRADO' if paciente else 'NO ENCONTRADO'}")
        
        # 2. Verificar Historias
        stmt = (
            select(HistoriaClinica)
            .where(
                HistoriaClinica.paciente_id == paciente_id,
                HistoriaClinica.especialista_id == especialista_id,
            )
        )
        items = list(session.exec(stmt).all())
        print(f"PASO 2 (Obtener Historias): {len(items)} historias encontradas")
        
        for i, h in enumerate(items):
            print(f"  [{i}] Historia ID: {h.id}, Fecha: {h.fecha_apertura}, Motivo: {h.motivo_consulta}")
            try:
                stmt_count = select(func.count()).select_from(HistoriaClinicaAdjunto).where(HistoriaClinicaAdjunto.historia_id == h.id)
                count = session.exec(stmt_count).one()
                print(f"      - Adjuntos count: {count}")
            except Exception as e:
                print(f"      - Error contando adjuntos: {e}")

if __name__ == "__main__":
    debug_api_logic()
