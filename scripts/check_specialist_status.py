from sqlmodel import Session, select
from app.database import engine
from app.models.especialista import Especialista

def check_specialist_status():
    with Session(engine) as session:
        statement = select(Especialista).where(Especialista.email == "admin@odontofocus.com")
        especialista = session.exec(statement).first()
        
        if especialista:
            print(f"--- Info Especialista ---")
            print(f"Email: {especialista.email}")
            print(f"Activo: {especialista.activo}")
            print(f"Suscripción Activa: {getattr(especialista, 'suscripcion_activa', 'N/A')}")
            print(f"Fecha Vencimiento: {getattr(especialista, 'fecha_vencimiento_suscripcion', 'N/A')}")
            # print(f"Password Hash: {especialista.password_hash}")
        else:
            print("Especialista 'admin@odontofocus.com' no encontrado.")

if __name__ == "__main__":
    check_specialist_status()
