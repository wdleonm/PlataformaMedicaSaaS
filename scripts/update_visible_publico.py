import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
from app.database import engine
from sqlmodel import text

def update_db():
    with engine.connect() as con:
        # Update null visible_publico to true
        res = con.execute(text("""
            UPDATE sys_config.servicios 
            SET visible_publico = true 
            WHERE visible_publico IS NULL;
        """))
        con.commit()
        print(f"Updated {res.rowcount} rows in sys_config.servicios where visible_publico was NULL.")

if __name__ == "__main__":
    update_db()
