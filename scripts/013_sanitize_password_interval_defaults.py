from sqlalchemy import text
from app.database import engine

def update_db_schema():
    with engine.connect() as conn:
        try:
            # Eliminar el valor por defecto de la columna en la base de datos
            conn.execute(text("ALTER TABLE sys_config.especialistas ALTER COLUMN intervalo_cambio_password DROP DEFAULT;"))
            
            # Poner en NULL los intervalos donde NO se exige cambio de password
            conn.execute(text("UPDATE sys_config.especialistas SET intervalo_cambio_password = NULL WHERE exigir_cambio_password = FALSE;"))
            
            conn.commit()
            print("Base de datos saneada: valor por defecto eliminado e intervalos limpiados.")
        except Exception as e:
            conn.rollback()
            print(f"Error al sanear la base de datos: {e}")

if __name__ == "__main__":
    update_db_schema()
