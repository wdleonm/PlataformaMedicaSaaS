from app.database import engine
from sqlalchemy import text
import sys

def check_ids():
    try:
        with engine.connect() as conn:
            # Current expert ID in sys_config (there might be multiple?)
            specialists = conn.execute(text("SELECT id, email FROM sys_config.especialistas")).fetchall()
            print("Specialists in sys_config.especialistas:")
            for s in specialists:
                print(f" - ID: {s[0]}, Email: {s[1]}")
            
            # IDs in clinical tables
            tables = ['pacientes', 'citas', 'presupuestos']
            for table in tables:
                col_names = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sys_clinical' AND table_name = '{table}'")).fetchall()
                col_names = [c[0] for c in col_names]
                
                if 'especialista_id' in col_names:
                    ids = conn.execute(text(f"SELECT DISTINCT especialista_id FROM sys_clinical.{table}")).fetchall()
                    print(f"Distinct especialista_id in sys_clinical.{table}:", [str(i[0]) for i in ids])
                else:
                    print(f"Column 'especialista_id' not found in sys_clinical.{table}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_ids()
