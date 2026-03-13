from app.database import engine
from sqlmodel import text

def check_verbose():
    with engine.connect() as con:
        print("\n--- TODOS LOS ESPECIALISTAS ---")
        res = con.execute(text("SELECT id, email, nombre FROM sys_config.especialistas"))
        especialistas = {e[0]: e[1] for e in res.fetchall()}
        for eid, email in especialistas.items():
            print(f"ID: {eid} | Email: {email}")

        print("\n--- DISTRIBUCION DE DATA REAL ---")
        # Encontrar especialistas huérfanos o con IDs distintos
        tables = [
            ("pacientes", "sys_clinical.pacientes"),
            ("citas", "sys_clinical.citas"),
            ("presupuestos", "sys_clinical.presupuestos")
        ]
        
        for name, table in tables:
            print(f"\nDistribución en {name}:")
            counts = con.execute(text(f"SELECT especialista_id, COUNT(*) FROM {table} GROUP BY especialista_id"))
            for cid, count in counts.fetchall():
                email = especialistas.get(cid, "### UNKNOWN/DELETED ###")
                print(f"Especialista: {email} ({cid}) -> {count} registros")

if __name__ == "__main__":
    check_verbose()
