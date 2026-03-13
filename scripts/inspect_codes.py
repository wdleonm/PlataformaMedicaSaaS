from sqlmodel import Session, create_engine, text
import os

DATABASE_URL = "postgresql://postgres:123456@localhost:5432/analytics"
engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    print("INSUMOS:")
    res = session.execute(text("SELECT id, nombre, codigo FROM sys_config.insumos"))
    for row in res:
        print(f"ID: {row[0]}, Name: {row[1]}, Code: {row[2]}")
    
    print("\nSERVICIOS:")
    res = session.execute(text("SELECT id, nombre, codigo FROM sys_config.servicios"))
    for row in res:
        print(f"ID: {row[0]}, Name: {row[1]}, Code: {row[2]}")
