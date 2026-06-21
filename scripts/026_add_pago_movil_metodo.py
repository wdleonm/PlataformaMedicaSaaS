import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:123456@localhost:5432/analytics"

engine = create_engine(DATABASE_URL)

sql_migration = """
-- 1. Eliminar la restricción check anterior primero
ALTER TABLE sys_clinical.abonos DROP CONSTRAINT IF EXISTS abonos_metodo_pago_check;

-- 2. Actualizar registros existentes a los nuevos nombres
UPDATE sys_clinical.abonos SET metodo_pago = 'efectivo_dolar' WHERE metodo_pago = 'efectivo';
UPDATE sys_clinical.abonos SET metodo_pago = 'transferencia_nacional' WHERE metodo_pago = 'transferencia';
UPDATE sys_clinical.abonos SET metodo_pago = 'otro' WHERE metodo_pago = 'cheque';

-- 3. Agregar la nueva restricción CHECK
ALTER TABLE sys_clinical.abonos ADD CONSTRAINT abonos_metodo_pago_check CHECK (metodo_pago IN (
    'efectivo_dolar', 'efectivo_bs', 'tarjeta_debito', 'tarjeta_debito_internacional',
    'tarjeta_credito', 'zelle', 'transferencia_nacional', 'transferencia_internacional',
    'criptomonedas', 'usdt', 'zinli', 'wally', 'otro'
));
"""

try:
    with engine.connect() as conn:
        conn.execute(text(sql_migration))
        conn.commit()
    print("Database updated successfully: Payment methods constraint and records migrated.")
except Exception as e:
    print(f"Error updating database: {e}")
