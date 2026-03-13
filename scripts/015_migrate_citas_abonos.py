from app.database import engine
from sqlmodel import text

def migrate():
    with engine.connect() as con:
        print("Migrando tablas para vinculación Cita-Presupuesto-Abono...")
        con.execute(text("""
            ALTER TABLE sys_clinical.citas 
            ADD COLUMN IF NOT EXISTS presupuesto_id UUID REFERENCES sys_clinical.presupuestos(id);
            
            ALTER TABLE sys_clinical.citas 
            ADD COLUMN IF NOT EXISTS abono_id UUID REFERENCES sys_clinical.abonos(id);
            
            ALTER TABLE sys_clinical.abonos 
            ADD COLUMN IF NOT EXISTS cita_id UUID REFERENCES sys_clinical.citas(id);
        """))
        con.commit()
        print("Migración completada con éxito.")

if __name__ == "__main__":
    migrate()
