from app.database import engine
from sqlalchemy import text
import sys

def check_counts_per_id():
    try:
        with engine.connect() as conn:
            target_id = 'c0943115-4691-4413-97fa-1efa21723b51'
            print(f"Checking data for spec ID: {target_id}")
            
            # Check patients
            p_count = conn.execute(text(f"SELECT count(*) FROM sys_clinical.pacientes WHERE especialista_id = '{target_id}'")).scalar()
            print(f"Pacientes for {target_id}: {p_count}")
            
            # Check if there are active patients
            p_active_count = conn.execute(text(f"SELECT count(*) FROM sys_clinical.pacientes WHERE especialista_id = '{target_id}' AND activo = True")).scalar()
            print(f"Pacientes ACTIVOS for {target_id}: {p_active_count}")

            # Check appointments
            c_count = conn.execute(text(f"SELECT count(*) FROM sys_clinical.citas WHERE especialista_id = '{target_id}'")).scalar()
            print(f"Citas for {target_id}: {c_count}")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_counts_per_id()
