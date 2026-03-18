import sys
import os
from sqlalchemy import text

sys.path.append(os.path.abspath('backend'))
from app.database import engine

def main():
    print("Resetting transactional data...")
    with engine.connect() as conn:
        # Use a list of tables to ensure it works even if the SQL file has psql specific syntax
        tables = [
            "sys_clinical.abonos",
            "sys_clinical.presupuesto_detalles",
            "sys_clinical.presupuestos",
            "sys_clinical.citas",
            "sys_clinical.odontograma_registros",
            "sys_clinical.historias_clinicas_adjuntos",
            "sys_clinical.historias_clinicas",
            "sys_clinical.pacientes",
            "sys_clinical.cola_mensajes"
        ]
        
        truncate_query = f"TRUNCATE TABLE {', '.join(tables)} RESTART IDENTITY CASCADE;"
        try:
            conn.execute(text(truncate_query))
            conn.commit()
            print("Transactional data reset successfully.")
        except Exception as e:
            print(f"Error resetting data: {e}")

if __name__ == "__main__":
    main()
