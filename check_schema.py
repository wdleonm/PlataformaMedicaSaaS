import sys
import os

sys.path.append(os.path.abspath("backend"))
from app.database import engine
from sqlmodel import Session, text

with Session(engine) as session:
    res = session.exec(text("SELECT column_name FROM information_schema.columns WHERE table_name='odontograma_registros'")).all()
    print("Columns:", res)
