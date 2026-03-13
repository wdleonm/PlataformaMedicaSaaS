from sqlmodel import Session, select
from app.database import engine
from app.models.especialista import Especialista
from app.api.auth import get_password_hash, verify_password

def fix_specialist_password():
    with Session(engine) as session:
        statement = select(Especialista).where(Especialista.email == "admin@odontofocus.com")
        especialista = session.exec(statement).first()
        
        if especialista:
            print(f"Especialista encontrado: {especialista.email}")
            print(f"Hash actual: {especialista.password_hash}")
            
            # Verificar si '123456' ya funciona
            if verify_password("123456", especialista.password_hash):
                print("La contraseña '123456' ya es CORRECTA para este especialista.")
            else:
                print("La contraseña '123456' es INCORRECTA. Actualizando...")
                especialista.password_hash = get_password_hash("123456")
                session.add(especialista)
                session.commit()
                print("Contraseña actualizada a '123456' exitosamente.")
        else:
            print("Especialista 'admin@odontofocus.com' no encontrado.")

if __name__ == "__main__":
    fix_specialist_password()
