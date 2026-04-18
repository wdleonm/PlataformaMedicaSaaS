from sqlmodel import Session, select
from app.database import engine
from app.models.odontograma import OdontogramaHallazgo

def update_hallazgos():
    with Session(engine) as session:
        all_h = session.exec(select(OdontogramaHallazgo)).all()
        
        # Ocultar Amalgama y Resina
        for h in all_h:
            if h.codigo in ("AMAL", "RESINA_OBT"):
                h.activo = False
            elif h.codigo == "COR":
                # Renombrar Corona a Prótesis y pasarlo a 'estado'
                h.nombre = "Prótesis"
                h.codigo = "PROT"
                h.categoria = "estado"
            elif h.codigo == "AUS":
                h.categoria = "estado"
            elif h.codigo == "SANO":
                h.categoria = "estado"
            elif h.codigo == "ENDO":
                h.categoria = "estado"
            session.add(h)
            
        # Crear Restauración y Extracción Indicada si no existen
        existing_codes = [h.codigo for h in all_h]
        if "REST" not in existing_codes:
            session.add(OdontogramaHallazgo(codigo="REST", nombre="Restauración", categoria="estado", orden=2, activo=True))
        if "EXO_IND" not in existing_codes:
            session.add(OdontogramaHallazgo(codigo="EXO_IND", nombre="Extracción Indicada", categoria="patologia", orden=3, activo=True))
            
        session.commit()
        print("Hallazgos actualizados correctamente.")

if __name__ == "__main__":
    update_hallazgos()
