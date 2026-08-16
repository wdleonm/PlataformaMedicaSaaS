import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

sql = """
DROP POLICY IF EXISTS recipes_especialista_policy ON sys_clinical.recipes;
CREATE POLICY recipes_especialista_policy 
    ON sys_clinical.recipes 
    FOR ALL 
    USING (
        especialista_id = current_setting('app.especialista_id', true)::uuid
    )
    WITH CHECK (
        especialista_id = current_setting('app.especialista_id', true)::uuid
    );
"""

print("Aplicando correccion RLS...")
success = False
error_msg = ""
try:
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    success = True
except Exception as e:
    error_msg = str(e)

if success:
    print("OK: Politica RLS corregida.")
else:
    print("ERROR:", error_msg)
