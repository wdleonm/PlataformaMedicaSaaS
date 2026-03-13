from sqlmodel import Session, select
from app.database import engine
from app.models.especialista import Especialista
from app.api.auth import verify_password

def check_daniela():
    with Session(engine) as session:
        statement = select(Especialista).where(Especialista.email == "danielaaleonr@gmail.com")
        e = session.exec(statement).first()
        if e:
            print(f"Daniela encontrada. Password '123456' es: {verify_password('123456', e.password_hash)}")
        else:
            print("Daniela no encontrada.")

if __name__ == "__main__":
    check_daniela()
