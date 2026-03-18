import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

sql_file = r"c:\xampp\htdocs\github\PlataformaMedicaSaaS\scripts\005_configuracion_global.sql"

with open(sql_file, "r", encoding="utf-8") as f:
    sql_content = f.read()

# Separate commands by ; (simple approach) or just execute the whole block if the driver supports it
# PostgreSQL driver usually supports multiple statements in one execute call
try:
    with engine.connect() as conn:
        conn.execute(text(sql_content))
        conn.commit()
    print("SQL executed successfully.")
except Exception as e:
    print(f"Error executing SQL: {e}")
