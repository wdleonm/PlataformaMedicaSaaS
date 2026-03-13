import sys
import os
from sqlmodel import Session, select
import re

# Añadir el path del backend para importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import engine
from app.models.especialista import Especialista

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = text.strip('-')
    return text

def generate_slugs():
    with Session(engine) as session:
        especialistas = session.exec(select(Especialista)).all()
        for e in especialistas:
            if not e.slug_url:
                base_slug = slugify(f"{e.nombre} {e.apellido}")
                # Verificar duplicados
                slug = base_slug
                counter = 1
                while session.exec(select(Especialista).where(Especialista.slug_url == slug)).first():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                e.slug_url = slug
                e.portal_visible = True # Activamos por defecto para los existentes en esta prueba
                print(f"Slug generado para {e.nombre} {e.apellido}: {slug}")
        
        session.commit()
        print("Finalizado.")

if __name__ == "__main__":
    generate_slugs()
