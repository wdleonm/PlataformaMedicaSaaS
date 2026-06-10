import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from sqlmodel import Session, select
from app.database import engine
from app.models.especialista import Especialista
from app.api.auth import get_password_hash

def fix():
    with Session(engine) as session:
        statement = select(Especialista).where(Especialista.email == "danielaaleonr@gmail.com")
        e = session.exec(statement).first()
        if e:
            e.password_hash = get_password_hash("123456.")
            session.add(e)
            session.commit()
            print("Password for danielaaleonr@gmail.com has been reset to '123456.'")
        else:
            print("Daniela not found")

if __name__ == "__main__":
    fix()
