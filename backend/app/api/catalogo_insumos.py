from typing import List, Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlmodel import Session, select

from app.database import get_session
from app.models.catalogo_insumo import CatalogoInsumo
from app.services.blue_dental_sync import sync_bluedental_catalogo

router = APIRouter(tags=["catalogo_insumos"])

@router.get("/api/catalogo-insumos", response_model=List[CatalogoInsumo])
def buscar_catalogo_insumos(
    q: Optional[str] = Query(None, description="Término de búsqueda (nombre o SKU)"),
    session: Session = Depends(get_session)
):
    stmt = select(CatalogoInsumo).where(CatalogoInsumo.activo == True).order_by(CatalogoInsumo.nombre)
    
    if q:
        termino = f"%{q.lower()}%"
        from sqlmodel import func, or_
        stmt = stmt.where(
            or_(
                func.lower(CatalogoInsumo.nombre).like(termino),
                func.lower(CatalogoInsumo.sku).like(termino)
            )
        )
        
    return session.exec(stmt.limit(50)).all()

@router.post("/api/catalogo-insumos/sync", status_code=202)
def iniciar_sincronizacion_catalogo(
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(sync_bluedental_catalogo)
    return {"message": "Sincronización en proceso. Podría tardar unos minutos."}
