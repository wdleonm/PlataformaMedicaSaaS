from app.database import engine
from sqlmodel import text

def check():
    with engine.connect() as con:
        # Specialists
        spec = con.execute(text("SELECT email, id FROM sys_config.especialistas")).fetchall()
        spec_dict = {str(s[1]): s[0] for s in spec}
        for email, id in spec:
            print(f"Spec: {email} | ID: {str(id)}")

        # Data
        for tbl in ["pacientes", "citas", "presupuestos"]:
            res = con.execute(text(f"SELECT especialista_id, COUNT(*) FROM sys_clinical.{tbl} GROUP BY especialista_id")).fetchall()
            for eid, cnt in res:
                email = spec_dict.get(str(eid), "UNKNOWN")
                print(f"Table: {tbl} | Email: {email} | Count: {cnt}")

if __name__ == "__main__":
    check()
