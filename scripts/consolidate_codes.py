from sqlmodel import Session, create_engine, text
import os

DATABASE_URL = "postgresql://postgres:123456@localhost:5432/analytics"
engine = create_engine(DATABASE_URL)

def get_next_num(session, table, prefix):
    res = session.execute(text(f"SELECT codigo FROM sys_config.{table} WHERE codigo LIKE :p ORDER BY codigo DESC LIMIT 1"), {"p": f"{prefix}-%"})
    row = res.fetchone()
    if row and "-" in row[0]:
        try:
            return int(row[0].split("-")[1]) + 1
        except:
            return 1
    return 1

with Session(engine) as session:
    print("Fixing Insumos...")
    # Find NULL codes
    res = session.execute(text("SELECT id, nombre FROM sys_config.insumos WHERE codigo IS NULL")).all()
    for row in res:
        id, nombre = row
        next_num = get_next_num(session, "insumos", "I")
        new_code = f"I-{next_num:04d}"
        print(f"Assigining {new_code} to {nombre}")
        session.execute(text("UPDATE sys_config.insumos SET codigo = :c WHERE id = :id"), {"c": new_code, "id": id})
        session.commit() # Commit each to update next_num correctly

    print("\nFixing Servicios...")
    # Find non-standard codes and NULLs
    res = session.execute(text("SELECT id, nombre, codigo FROM sys_config.servicios")).all()
    for row in res:
        id, nombre, old_code = row
        if not old_code or not old_code.startswith("S-"):
             # If it's already something like ORT01, we change it to S-000x
             next_num = get_next_num(session, "servicios", "S")
             new_code = f"S-{next_num:04d}"
             print(f"Updating {nombre}: {old_code} -> {new_code}")
             session.execute(text("UPDATE sys_config.servicios SET codigo = :c WHERE id = :id"), {"c": new_code, "id": id})
             session.commit()

    print("\nFinal check:")
    res = session.execute(text("SELECT nombre, codigo FROM sys_config.insumos ORDER BY codigo"))
    for row in res: print(f"INS: [{row[1]}] {row[0]}")
    res = session.execute(text("SELECT nombre, codigo FROM sys_config.servicios ORDER BY codigo"))
    for row in res: print(f"SER: [{row[1]}] {row[0]}")
