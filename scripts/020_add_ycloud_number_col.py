import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://plataforma_user:change_me@localhost:5432/plataforma_medica"

engine = create_engine(DATABASE_URL)

sql = """
ALTER TABLE sys_config.configuracion_global 
ADD COLUMN IF NOT EXISTS ycloud_whatsapp_number VARCHAR(50);
"""

try:
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    print("Database updated successfully: ycloud_whatsapp_number column added.")
except Exception as e:
    print(f"Error updating database: {e}")
