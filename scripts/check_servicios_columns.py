import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from app.database import engine
from sqlmodel import text

def check():
    with engine.connect() as con:
        # Check table columns for sys_config.servicios
        res = con.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'sys_config' AND table_name = 'servicios';
        """))
        print("Columns in sys_config.servicios:")
        for r in res.fetchall():
            print(f"- {r[0]}: {r[1]}")

if __name__ == "__main__":
    check()
