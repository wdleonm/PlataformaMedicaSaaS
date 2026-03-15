from app.database import engine
from sqlalchemy import text
import sys

def check_clinical_data():
    try:
        with engine.connect() as conn:
            # List tables in sys_clinical
            tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sys_clinical'")).fetchall()
            print("Tables in sys_clinical:", [t[0] for t in tables])
            
            for table in tables:
                t_name = table[0]
                count = conn.execute(text(f"SELECT count(*) FROM sys_clinical.{t_name}")).scalar()
                print(f"Count in {t_name}: {count}")
                
            # Check specialist ID
            specialist = conn.execute(text("SELECT id, email FROM sys_config.especialistas WHERE email = 'admin@odontofocus.com'")).fetchone()
            if specialist:
                print(f"Admin Specialist ID: {specialist[0]}")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_clinical_data()
