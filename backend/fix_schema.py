from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Conexión exitosa...")
    try:
        conn.execute(text('ALTER TABLE sys_config.administradores ADD COLUMN IF NOT EXISTS pin_seguridad_hash VARCHAR(255)'))
        conn.commit()
        print("Columna pin_seguridad_hash añadida (si no existía).")
    except Exception as e:
        print(f"Error al añadir columna: {e}")
