from sqlmodel import Session, select, func
from app.database import engine
from app.models.paciente import Paciente
from app.models.historia_clinica import HistoriaClinica, HistoriaClinicaAdjunto
from app.models.especialista import Especialista

def check_db():
    with Session(engine) as session:
        # Check Specialists
        specialists = session.exec(select(Especialista)).all()
        print(f"Specialists found: {len(specialists)}")
        for s in specialists:
            print(f"  - ID: {s.id}, Name: {s.nombre}")

        # Check Patients
        patients = session.exec(select(Paciente).where(Paciente.nombre.contains('Gabriela'))).all()
        print(f"\nPatients matching 'Gabriela': {len(patients)}")
        for p in patients:
            print(f"  - ID: {p.id}, Name: {p.nombre} {p.apellido}, Specialist ID: {p.especialista_id}")

            # Check Historias for this patient
            historias = session.exec(select(HistoriaClinica).where(HistoriaClinica.paciente_id == p.id)).all()
            print(f"    - Historias found: {len(historias)}")
            for h in historias:
                print(f"      * HC ID: {h.id}, Date: {h.fecha_apertura}")
                # Test the fixed way
                try:
                    count_stmt = select(func.count()).select_from(HistoriaClinicaAdjunto).where(HistoriaClinicaAdjunto.historia_id == h.id)
                    count_fixed = session.exec(count_stmt).one()
                    print(f"        (Count check): {count_fixed}")
                except Exception as e:
                    print(f"        (Count check) ERROR: {e}")

if __name__ == "__main__":
    check_db()
