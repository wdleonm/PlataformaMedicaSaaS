from sqlmodel import Session, select
from app.database import engine
from app.models.odontograma import OdontogramaHallazgo

def force_seed_hallazgos():
    required_hallazgos = [
        {"codigo": "SANO", "nombre": "Sano", "categoria": "estado", "orden": 1, "activo": True},
        {"codigo": "REST", "nombre": "Restauración", "categoria": "estado", "orden": 2, "activo": True},
        {"codigo": "PROT", "nombre": "Prótesis", "categoria": "estado", "orden": 3, "activo": True},
        {"codigo": "AUS", "nombre": "Diente Ausente", "categoria": "estado", "orden": 4, "activo": True},
        {"codigo": "ENDO", "nombre": "Endodoncia", "categoria": "estado", "orden": 5, "activo": True},
        
        {"codigo": "EXO_IND", "nombre": "Extracción Indicada", "categoria": "patologia", "orden": 6, "activo": True},
        {"codigo": "ENDO_IND", "nombre": "Endodoncia Indicada", "categoria": "patologia", "orden": 7, "activo": True},
        {"codigo": "CARIES", "nombre": "Caries", "categoria": "patologia", "orden": 8, "activo": True},
    ]
    
    with Session(engine) as session:
        for item in required_hallazgos:
            # Buscar si ya existe por código
            existing = session.exec(select(OdontogramaHallazgo).where(OdontogramaHallazgo.codigo == item["codigo"])).first()
            if existing:
                # Actualizar si existe (por si las categorias o nombres estaban mal)
                existing.nombre = item["nombre"]
                existing.categoria = item["categoria"]
                existing.orden = item["orden"]
                existing.activo = item["activo"]
                session.add(existing)
                print(f"Actualizado: {item['codigo']} -> {item['categoria']}")
            else:
                # Crear si no existe
                new_h = OdontogramaHallazgo(**item)
                session.add(new_h)
                print(f"Creado: {item['codigo']} -> {item['categoria']}")
                
        # Ocultar los obsoletos si existen (Corona, Amalgama, Resina)
        obsoletos = ["COR", "AMAL", "RESINA_OBT"]
        for obs in obsoletos:
            existing = session.exec(select(OdontogramaHallazgo).where(OdontogramaHallazgo.codigo == obs)).first()
            if existing:
                existing.activo = False
                session.add(existing)
                print(f"Ocultado obsoleto: {obs}")
                
        session.commit()
        print("✅ Todos los hallazgos han sido sincronizados correctamente en la base de datos.")

if __name__ == "__main__":
    force_seed_hallazgos()
