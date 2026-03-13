import sys
import os
from sqlmodel import Session, select
from passlib.context import CryptContext

# Añadir el path del backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import engine
from app.models.especialista import Especialista # Para queSQLModel cargue metadatos si es necesario
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def update_admin():
    new_email = "smartlift1608@gmail.com"
    new_password = "Admin123!" # Contraseña temporal
    hash_pass = pwd_context.hash(new_password)

    with Session(engine) as session:
        # Importar el modelo Admin aquí para evitar problemas de circularidad si los hay
        from app.models.especialista import Especialista # No es el admin, busquemos el modelo real
        # El modelo admin suele estar en modelos de admin
        from sqlalchemy import Table, MetaData
        
        metadata = MetaData()
        admin_table = Table('administradores', metadata, schema='sys_config', autoload_with=engine)
        
        # Primero limpiamos si hay otros
        session.execute(text("DELETE FROM sys_config.administradores"))
        
        # Insertamos el nuevo
        session.execute(
            text("INSERT INTO sys_config.administradores (email, password_hash, nombre, apellido) VALUES (:email, :hash, :nom, :ape)"),
            {"email": new_email, "hash": hash_pass, "nom": "William", "ape": "Leon"}
        )
        
        session.commit()
        print(f"Admin actualizado con éxito.")
        print(f"Email: {new_email}")
        print(f"Password temporal: {new_password}")

if __name__ == "__main__":
    update_admin()
