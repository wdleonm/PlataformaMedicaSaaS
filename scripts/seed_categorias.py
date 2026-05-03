import sys
import os
from uuid import uuid4
from datetime import datetime, timezone

# Agregar el directorio actual al path para poder importar la app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import Session, select
from app.database import engine
from app.models.finanzas import CategoriaGasto

def seed():
    default_categories = [
        'Alquiler de Local',
        'Alquiler de Silla',
        'Secretaría/Sueldos',
        'Electricidad',
        'Agua',
        'Teléfono/Móvil',
        'Internet',
        'Publicidad/Marketing',
        'Limpieza',
        'Seguros',
        'Impuestos',
        'Otros'
    ]
    
    with Session(engine) as session:
        for cat_name in default_categories:
            # Verificar si ya existe
            existing = session.exec(select(CategoriaGasto).where(CategoriaGasto.nombre == cat_name)).first()
            if not existing:
                new_cat = CategoriaGasto(
                    id=uuid4(),
                    nombre=cat_name,
                    especialista_id=None,
                    created_at=datetime.now(timezone.utc)
                )
                session.add(new_cat)
                print(f"Agregando categoría: {cat_name}")
        
        session.commit()
        print("Seed completado exitosamente.")

if __name__ == "__main__":
    seed()
