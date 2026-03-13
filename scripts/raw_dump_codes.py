from sqlmodel import Session, create_engine, text
import os

DATABASE_URL = "postgresql://postgres:123456@localhost:5432/analytics"
engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    print("INSUMOS RAW DUMP:")
    res = session.execute(text("SELECT nombre, codigo FROM sys_config.insumos"))
    for row in res:
        print(f"[{row[1]}] - {row[0]}")
    
    print("\nSERVICIOS RAW DUMP:")
    res = session.execute(text("SELECT nombre, codigo FROM sys_config.servicios"))
    for row in res:
        print(f"[{row[1]}] - {row[0]}")
