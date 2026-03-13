from app.database import engine
from sqlmodel import text
from datetime import date

def dump_data():
    with engine.connect() as con:
        print(f"Server Date Today: {date.today()}")
        print("\n--- CITAS EN DB ---")
        res = con.execute(text("SELECT fecha_hora, estado, especialista_id FROM sys_clinical.citas"))
        for c in res.fetchall():
            print(f"Hora: {c[0]} | Estado: {c[1]} | Specialist: {c[2]}")
        
        print("\n--- PACIENTES EN DB ---")
        res = con.execute(text("SELECT nombre, activo, especialista_id FROM sys_clinical.pacientes"))
        for p in res.fetchall():
            print(f"Nombre: {p[0]} | Activo: {p[1]} | Specialist: {p[2]}")

if __name__ == "__main__":
    dump_data()
