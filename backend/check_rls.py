from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SELECT policyname, tablename, cmd, qual FROM pg_policies WHERE schemaname = 'sys_config'"))
    print("--- Polizas RLS ---")
    for row in res:
        print(f"Tabla: {row[1]}, Nombre: {row[0]}, Comando: {row[2]}, Qual: {row[3]}")
