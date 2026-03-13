from sqlmodel import Session, create_engine, text
import os

DATABASE_URL = "postgresql://postgres:123456@localhost:5432/analytics"
engine = create_engine(DATABASE_URL)

def fix_code(code, prefix):
    if not code: return None
    # If it's already Correct (Prefix-0000)
    import re
    if re.match(rf"^{prefix}-\d{{4}}$", code):
        return code
    
    # If it's Prefix0000 (no hyphen)
    if re.match(rf"^{prefix}\d{{4}}$", code):
        return f"{prefix}-{code[len(prefix):]}"
    
    # If it's just a number or something else, we might need manual logic.
    # But let's start with the most obvious ones. Sospecho que puse "S0001" en la previa.
    return code

with Session(engine) as session:
    print("--- FIXING INSUMOS ---")
    res = session.execute(text("SELECT id, nombre, codigo FROM sys_config.insumos")).all()
    for row in res:
        id, nombre, old_code = row
        new_code = old_code
        if old_code:
            # Detect primary prefix or maintain existing
            if old_code.startswith("I") and "-" not in old_code:
                new_code = f"I-{old_code[1:].zfill(4)}" if old_code[1:].isdigit() else old_code
            elif old_code.startswith("M") and "-" not in old_code:
                 new_code = f"M-{old_code[1:].zfill(4)}" if old_code[1:].isdigit() else old_code
        
        if new_code != old_code:
            print(f"Update Insumo '{nombre}': {old_code} -> {new_code}")
            session.execute(text("UPDATE sys_config.insumos SET codigo = :new WHERE id = :id"), {"new": new_code, "id": id})

    print("\n--- FIXING SERVICIOS ---")
    res = session.execute(text("SELECT id, nombre, codigo FROM sys_config.servicios")).all()
    for row in res:
        id, nombre, old_code = row
        new_code = old_code
        if old_code:
            if old_code.startswith("S") and "-" not in old_code:
                # Si es algo como S0001 o solo S1
                digits = "".join([c for c in old_code[1:] if c.isdigit()])
                if digits:
                    new_code = f"S-{int(digits):04d}"
        
        if new_code != old_code:
            print(f"Update Servicio '{nombre}': {old_code} -> {new_code}")
            session.execute(text("UPDATE sys_config.servicios SET codigo = :new WHERE id = :id"), {"new": new_code, "id": id})
    
    session.commit()
    print("\nMigration complete.")
