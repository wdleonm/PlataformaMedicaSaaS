import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://plataforma_user:change_me@localhost:5432/plataforma_medica"

engine = create_engine(DATABASE_URL)

sql = """
CREATE TABLE IF NOT EXISTS sys_config.bcv_tasas_historial (
    id UUID PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tasa_usd FLOAT NOT NULL,
    tasa_eur FLOAT NOT NULL,
    fuente VARCHAR(20) DEFAULT 'BCV'
);

CREATE INDEX IF NOT EXISTS idx_bcv_historial_fecha ON sys_config.bcv_tasas_historial(fecha);
"""

try:
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    print("Database updated: sys_config.bcv_tasas_historial table created.")
except Exception as e:
    print(f"Error updating database: {e}")
