from sqlmodel import Session, select
from app.database import engine
from app.models.odontograma import OdontogramaHallazgo

def ver_hallazgos():
    with Session(engine) as session:
        all_h = session.exec(select(OdontogramaHallazgo)).all()
        for h in all_h:
            print(f"ID: {h.id}, Cod: {h.codigo}, Nombre: {h.nombre}, Cat: {h.categoria}")

if __name__ == "__main__":
    ver_hallazgos()
