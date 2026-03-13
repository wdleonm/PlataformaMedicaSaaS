from sqlalchemy import text
from app.database import engine

def update_schema():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE sys_config.especialistas ADD COLUMN exigir_cambio_password BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE sys_config.especialistas ADD COLUMN intervalo_cambio_password INTEGER DEFAULT 90;"))
            conn.execute(text("ALTER TABLE sys_config.especialistas ADD COLUMN fecha_ultimo_cambio_password TIMESTAMP DEFAULT NOW();"))
            conn.commit()
            print("Tablas actualizadas exitosamente.")
        except Exception as e:
            conn.rollback()
            print(f"Error o ya existen las columnas: {e}")

if __name__ == "__main__":
    update_schema()
