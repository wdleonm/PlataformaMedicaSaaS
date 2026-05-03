from datetime import date, datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, or_
from app.database import get_session
from app.api.dependencies import get_current_especialista
from app.models.especialista import Especialista
from app.models.finanzas import GastoFijo, CategoriaGasto

router = APIRouter(prefix="/api/gastos-fijos", tags=["Gastos Fijos"])

# ── CATEGORIAS DE GASTOS ─────────────────────────────────────────────────────

@router.get("/categorias", response_model=List[CategoriaGasto])
def list_categorias_gastos(
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Lista las categorías de gastos (globales + personalizadas del especialista)."""
    stmt = select(CategoriaGasto).where(
        or_(
            CategoriaGasto.especialista_id == None,
            CategoriaGasto.especialista_id == especialista.id
        )
    ).order_by(CategoriaGasto.nombre)
    return session.exec(stmt).all()

@router.post("/categorias", response_model=CategoriaGasto)
def create_categoria_gasto(
    categoria: CategoriaGasto,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Crea una nueva categoría personalizada para el especialista."""
    categoria.especialista_id = especialista.id
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria

@router.delete("/categorias/{categoria_id}")
def delete_categoria_gasto(
    categoria_id: UUID,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Elimina una categoría personalizada."""
    categoria = session.get(CategoriaGasto, categoria_id)
    if not categoria or categoria.especialista_id != especialista.id:
        raise HTTPException(status_code=404, detail="Categoría no encontrada o no es personalizable")
    
    # Verificar si tiene gastos asociados antes de borrar (opcional, por ahora permitimos borrar si es suya)
    session.delete(categoria)
    session.commit()
    return {"message": "Categoría eliminada"}


# ── GASTOS FIJOS ─────────────────────────────────────────────────────────────

@router.get("/", response_model=List[dict])
def list_gastos_fijos(
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None, ge=2000),
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Lista los gastos fijos del especialista, incluyendo el nombre de la categoría."""
    stmt = select(GastoFijo, CategoriaGasto).join(
        CategoriaGasto, GastoFijo.categoria_id == CategoriaGasto.id
    ).where(GastoFijo.especialista_id == especialista.id)
    
    if mes:
        stmt = stmt.where(GastoFijo.periodo_mes == mes)
    if anio:
        stmt = stmt.where(GastoFijo.periodo_anio == anio)
    
    stmt = stmt.order_by(GastoFijo.fecha_pago.desc())
    results = session.exec(stmt).all()
    
    # Formatear respuesta para incluir el nombre de la categoría plano
    return [
        {
            **gasto.dict(),
            "categoria_nombre": categoria.nombre
        }
        for gasto, categoria in results
    ]

@router.post("/", response_model=dict)
def create_gasto_fijo(
    gasto: GastoFijo,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Crea un nuevo gasto fijo."""
    gasto.especialista_id = especialista.id
    if not gasto.periodo_mes:
        gasto.periodo_mes = gasto.fecha_pago.month
    if not gasto.periodo_anio:
        gasto.periodo_anio = gasto.fecha_pago.year
        
    session.add(gasto)
    session.commit()
    session.refresh(gasto)
    
    # Devolver con nombre de categoría
    cat = session.get(CategoriaGasto, gasto.categoria_id)
    res = gasto.dict()
    res["categoria_nombre"] = cat.nombre if cat else "Sin categoría"
    return res

@router.put("/{gasto_id}", response_model=dict)
def update_gasto_fijo(
    gasto_id: UUID,
    gasto_data: dict,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Actualiza un gasto fijo existente."""
    gasto = session.get(GastoFijo, gasto_id)
    if not gasto or gasto.especialista_id != especialista.id:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    for key, value in gasto_data.items():
        if hasattr(gasto, key):
            setattr(gasto, key, value)
    
    gasto.updated_at = datetime.now(timezone.utc)
    session.add(gasto)
    session.commit()
    session.refresh(gasto)
    
    cat = session.get(CategoriaGasto, gasto.categoria_id)
    res = gasto.dict()
    res["categoria_nombre"] = cat.nombre if cat else "Sin categoría"
    return res

@router.delete("/{gasto_id}")
def delete_gasto_fijo(
    gasto_id: UUID,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Elimina un gasto fijo."""
    gasto = session.get(GastoFijo, gasto_id)
    if not gasto or gasto.especialista_id != especialista.id:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    session.delete(gasto)
    session.commit()
    return {"message": "Gasto eliminado correctamente"}
