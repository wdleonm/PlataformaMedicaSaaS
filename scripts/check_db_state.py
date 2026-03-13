from app.database import engine
from sqlmodel import text
import uuid

def check_data():
    with engine.connect() as con:
        # Check Specialists
        print("\n--- ESPECIALISTAS ---")
        res = con.execute(text("SELECT id, email, nombre FROM sys_config.especialistas"))
        especialistas = res.fetchall()
        for e in especialistas:
            print(f"ID: {e[0]} | Email: {e[1]} | Nombre: {e[2]}")

        # Check Data Counts per Specialist
        print("\n--- DATA COUNTS PER SPECIALIST ---")
        for e in especialistas:
            eid = e[0]
            pacientes = con.execute(text(f"SELECT COUNT(*) FROM sys_clinical.pacientes WHERE especialista_id = '{eid}'")).scalar()
            citas = con.execute(text(f"SELECT COUNT(*) FROM sys_clinical.citas WHERE especialista_id = '{eid}'")).scalar()
            presupuestos = con.execute(text(f"SELECT COUNT(*) FROM sys_clinical.presupuestos WHERE especialista_id = '{eid}'")).scalar()
            print(f"Email: {e[1]} | Pacientes: {pacientes} | Citas: {citas} | Presupuestos: {presupuestos}")

if __name__ == "__main__":
    check_data()
