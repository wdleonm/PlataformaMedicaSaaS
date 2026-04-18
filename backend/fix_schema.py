from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Conexión exitosa...")
    try:
        conn.execute(text('ALTER TABLE sys_config.administradores ADD COLUMN IF NOT EXISTS pin_seguridad_hash VARCHAR(255)'))
        try:
            conn.execute(text('ALTER TABLE sys_clinical.historias_clinicas ADD COLUMN actividades_realizadas VARCHAR'))
        except Exception:
            pass
        try:
            conn.execute(text('ALTER TABLE sys_config.insumos ADD COLUMN imagen_url VARCHAR'))
        except Exception:
            pass
        conn.commit()
        print("Columnas añadidas (si no existían).")
    except Exception as e:
        print(f"Error al añadir columna: {e}")
