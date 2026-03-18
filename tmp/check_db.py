import sys
import os
from sqlalchemy import text, inspect

# PATH
sys.path.append(os.path.abspath('backend'))
from app.database import engine

def main():
    print("Checking database columns for sys_config.especialistas...")
    with engine.connect() as conn:
        try:
            res = conn.execute(text("SELECT email FROM sys_config.especialistas LIMIT 1")).fetchone()
            print(f"Basic result: {res}")
            
            res2 = conn.execute(text("SELECT redes_sociales FROM sys_config.especialistas LIMIT 1")).fetchone()
            print(f"Redes sociales result: {res2}")
        except Exception as e:
            print(f"Error selecting columns: {e}")
            
    i = inspect(engine)
    cols = [c['name'] for c in i.get_columns('especialistas', schema='sys_config')]
    print(f"Final columns list: {cols}")

if __name__ == "__main__":
    main()
