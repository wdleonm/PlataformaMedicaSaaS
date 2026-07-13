import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Priorizar el del backend si lo corre desde la carpeta backend
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:123456@localhost:5432/analytics"

engine = create_engine(DATABASE_URL)

sql = """
ALTER TABLE sys_config.configuracion_global 
ADD COLUMN IF NOT EXISTS ycloud_usar_plantillas BOOLEAN DEFAULT FALSE;
"""

try:
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    print("Database updated successfully: ycloud_usar_plantillas column added.")
except Exception as e:
    print(f"Error updating database: {e}")
