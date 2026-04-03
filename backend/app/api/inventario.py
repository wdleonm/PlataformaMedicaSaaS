"""
Endpoints CRUD — Insumos y Servicios.
Fase 3.1 + 3.2 — Regla de Oro 3.2: Utilidad_Neta = Precio - Costo_insumos.

Insumos:
  POST   /api/insumos
  GET    /api/insumos                  (con filtro stock_bajo=true)
  GET    /api/insumos/{id}
  PATCH  /api/insumos/{id}
  DELETE /api/insumos/{id}             (borrado lógico)

Servicios:
  POST   /api/servicios
  GET    /api/servicios
  GET    /api/servicios/{id}           (incluye receta + costo calculado)
  PATCH  /api/servicios/{id}
  DELETE /api/servicios/{id}
  PUT    /api/servicios/{id}/receta    (reemplaza toda la receta de insumos)
  DELETE /api/servicios/{id}/receta/{insumo_id}
"""
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_especialista
from app.database import get_session
from app.models.especialista import Especialista
from app.models.insumo_servicio import Insumo, Servicio, ServicioInsumo, InventarioMovimiento
from app.schemas.insumos_servicios import (
    InsumoCreate, InsumoList, InsumoRead, InsumoUpdate,
    RecetaUpdate, ServicioCreate, ServicioInsumoRead,
    ServicioList, ServicioRead, ServicioUpdate,
)

router = APIRouter(tags=["inventario"])


# =============================================================================
# INSUMOS
# =============================================================================

@router.post("/api/insumos", response_model=InsumoRead, status_code=status.HTTP_201_CREATED)
def create_insumo(
    data: InsumoCreate,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> Insumo:
    codigo = data.codigo
    if not codigo:
        # Generar correlativo: buscar el último que empiece por 'I-'
        stmt = select(Insumo).where(
            Insumo.especialista_id == especialista.id,
            Insumo.codigo.ilike("I-%")
        ).order_by(Insumo.codigo.desc())
        last = session.exec(stmt).first()
        if last and "-" in last.codigo:
            try:
                parts = last.codigo.split("-")
                num = int(parts[1]) + 1
            except (ValueError, IndexError):
                num = 1
        else:
            num = 1
        codigo = f"I-{num:04d}"
    else:
        # Validar unicidad manual
        stmt = select(Insumo).where(
            Insumo.especialista_id == especialista.id,
            Insumo.codigo == codigo
        )
        if session.exec(stmt).first():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"El código de insumo '{codigo}' ya existe"
            )

    insumo = Insumo(
        especialista_id=especialista.id,
        **data.model_dump(exclude={"codigo"}),
        codigo=codigo
    )
    session.add(insumo)
    session.commit()
    session.refresh(insumo)
    
    # Registrar Kardex inicial si tiene stock
    if insumo.stock_actual > 0:
        costo_unit = insumo.costo_unitario
        if insumo.unidades_por_paquete and insumo.unidades_por_paquete > 1:
            costo_unit = insumo.costo_unitario / insumo.unidades_por_paquete
            
        mov = InventarioMovimiento(
            especialista_id=especialista.id,
            insumo_id=insumo.id,
            tipo="entrada",
            cantidad=insumo.stock_actual,
            costo_unitario_historico=costo_unit,
            motivo_o_referencia="Inventario inicial / Recién incorporado"
        )
        session.add(mov)
        session.commit()
        
    return _insumo_to_read(insumo)


@router.get("/api/insumos", response_model=InsumoList)
def list_insumos(
    q:          Optional[str]  = Query(default=None, description="Buscar por nombre o código"),
    stock_bajo: bool           = Query(default=False, description="Solo insumos con stock bajo"),
    skip:       int            = Query(default=0, ge=0),
    limit:      int            = Query(default=50, ge=1, le=200),
    session:    Session        = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> InsumoList:
    stmt = select(Insumo).where(
        Insumo.especialista_id == especialista.id,
        Insumo.activo == True,
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Insumo.nombre.ilike(like)) | (Insumo.codigo.ilike(like)))  # type: ignore
    if stock_bajo:
        # stock_actual <= stock_minimo
        stmt = stmt.where(Insumo.stock_actual <= Insumo.stock_minimo)

    all_rows = session.exec(stmt).all()
    total    = len(all_rows)
    items    = [_insumo_to_read(i) for i in all_rows[skip: skip + limit]]
    return InsumoList(total=total, items=items)


@router.get("/api/insumos/{insumo_id}", response_model=InsumoRead)
def get_insumo(
    insumo_id:   UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> InsumoRead:
    return _insumo_to_read(_get_insumo_or_404(session, insumo_id, especialista.id))


@router.patch("/api/insumos/{insumo_id}", response_model=InsumoRead)
def update_insumo(
    insumo_id:   UUID,
    data:        InsumoUpdate,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> InsumoRead:
    insumo = _get_insumo_or_404(session, insumo_id, especialista.id)
    
    # Determinar si hay cambio de stock manual
    old_stock = insumo.stock_actual
    new_stock = data.stock_actual if data.stock_actual is not None else -1
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(insumo, field, value)
    insumo.updated_at = datetime.now(timezone.utc)
    session.add(insumo)
    
    # Registrar Kardex si hubo cambio de stock
    if new_stock != -1 and new_stock != old_stock:
        diff = new_stock - old_stock
        tipo_mov = "entrada" if diff > 0 else "ajuste"
        
        costo_unit = insumo.costo_unitario
        if insumo.unidades_por_paquete and insumo.unidades_por_paquete > 1:
            costo_unit = insumo.costo_unitario / insumo.unidades_por_paquete
            
        mov = InventarioMovimiento(
            especialista_id=especialista.id,
            insumo_id=insumo.id,
            tipo=tipo_mov,
            cantidad=abs(diff),
            costo_unitario_historico=costo_unit,
            motivo_o_referencia="Reposición manual de stock" if diff > 0 else "Ajuste/Merma manual de stock"
        )
        session.add(mov)

    session.commit()
    session.refresh(insumo)
    return _insumo_to_read(insumo)


@router.get("/api/insumos/{insumo_id}/movimientos")
def list_movimientos_insumo(
    insumo_id: UUID,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Lista el historial de movimientos (Kardex) de un insumo específico."""
    _get_insumo_or_404(session, insumo_id, especialista.id)
    
    stmt = select(InventarioMovimiento).where(
        InventarioMovimiento.especialista_id == especialista.id,
        InventarioMovimiento.insumo_id == insumo_id
    ).order_by(InventarioMovimiento.fecha.desc())
    
    rows = session.exec(stmt).all()
    total = len(rows)
    items = list(rows[skip: skip + limit])
    return {"total": total, "items": items}


@router.delete("/api/insumos/{insumo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_insumo(
    insumo_id:   UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> None:
    insumo = _get_insumo_or_404(session, insumo_id, especialista.id)
    insumo.activo     = False
    insumo.updated_at = datetime.now(timezone.utc)
    session.add(insumo)
    session.commit()


# =============================================================================
# SERVICIOS
# =============================================================================

@router.post("/api/servicios", response_model=ServicioRead, status_code=status.HTTP_201_CREATED)
def create_servicio(
    data:        ServicioCreate,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> ServicioRead:
    codigo = data.codigo
    if not codigo:
        # Generar correlativo: buscar el último que empiece por 'S-'
        stmt = select(Servicio).where(
            Servicio.especialista_id == especialista.id,
            Servicio.codigo.ilike("S-%")
        ).order_by(Servicio.codigo.desc())
        last = session.exec(stmt).first()
        if last and "-" in last.codigo:
            try:
                parts = last.codigo.split("-")
                num = int(parts[1]) + 1
            except (ValueError, IndexError):
                num = 1
        else:
            num = 1
        codigo = f"S-{num:04d}"
    else:
        # Validar unicidad manual
        stmt = select(Servicio).where(
            Servicio.especialista_id == especialista.id,
            Servicio.codigo == codigo
        )
        if session.exec(stmt).first():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"El código de servicio '{codigo}' ya existe"
            )

    servicio = Servicio(
        especialista_id=especialista.id,
        **data.model_dump(exclude={"codigo"}),
        codigo=codigo
    )
    session.add(servicio)
    session.commit()
    session.refresh(servicio)
    return _servicio_to_read(session, servicio)


@router.get("/api/servicios", response_model=ServicioList)
def list_servicios(
    q:           Optional[str]  = Query(default=None),
    skip:        int            = Query(default=0, ge=0),
    limit:       int            = Query(default=50, ge=1, le=200),
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> ServicioList:
    stmt = select(Servicio).where(
        Servicio.especialista_id == especialista.id,
        Servicio.activo == True,
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Servicio.nombre.ilike(like)) | (Servicio.codigo.ilike(like)))  # type: ignore

    rows  = session.exec(stmt).all()
    total = len(rows)
    items = [_servicio_to_read(session, s) for s in rows[skip: skip + limit]]
    return ServicioList(total=total, items=items)


@router.get("/api/servicios/{servicio_id}", response_model=ServicioRead)
def get_servicio(
    servicio_id: UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> ServicioRead:
    return _servicio_to_read(session, _get_servicio_or_404(session, servicio_id, especialista.id))


@router.patch("/api/servicios/{servicio_id}", response_model=ServicioRead)
def update_servicio(
    servicio_id: UUID,
    data:        ServicioUpdate,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> ServicioRead:
    servicio = _get_servicio_or_404(session, servicio_id, especialista.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(servicio, field, value)
    servicio.updated_at = datetime.now(timezone.utc)
    session.add(servicio)
    session.commit()
    session.refresh(servicio)
    return _servicio_to_read(session, servicio)


@router.delete("/api/servicios/{servicio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_servicio(
    servicio_id: UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> None:
    servicio = _get_servicio_or_404(session, servicio_id, especialista.id)
    servicio.activo     = False
    servicio.updated_at = datetime.now(timezone.utc)
    session.add(servicio)
    session.commit()


# ---------------------------------------------------------------------------
# Receta de insumos
# ---------------------------------------------------------------------------

@router.put(
    "/api/servicios/{servicio_id}/receta",
    response_model=ServicioRead,
    summary="Reemplazar la receta de insumos de un servicio",
)
def set_receta(
    servicio_id: UUID,
    data:        RecetaUpdate,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> ServicioRead:
    """
    Sustituye toda la receta del servicio.
    Validaciones:
    - Todos los insumos_id deben pertenecer al mismo especialista.
    - No se permiten duplicados de insumo en la misma receta.
    """
    servicio = _get_servicio_or_404(session, servicio_id, especialista.id)

    # Verificar que todos los insumos existen y pertenecen al especialista
    insumo_ids = [item.insumo_id for item in data.insumos]
    if len(insumo_ids) != len(set(insumo_ids)):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La receta no puede tener el mismo insumo dos veces",
        )
    for insumo_id in insumo_ids:
        _get_insumo_or_404(session, insumo_id, especialista.id)

    # Eliminar receta actual
    old_items = session.exec(
        select(ServicioInsumo).where(ServicioInsumo.servicio_id == servicio_id)
    ).all()
    for item in old_items:
        session.delete(item)

    # Insertar nueva receta
    for item in data.insumos:
        si = ServicioInsumo(
            servicio_id=servicio_id,
            insumo_id=item.insumo_id,
            cantidad_utilizada=item.cantidad_utilizada,
        )
        session.add(si)

    session.commit()
    session.refresh(servicio)
    return _servicio_to_read(session, servicio)


@router.delete(
    "/api/servicios/{servicio_id}/receta/{insumo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Quitar un insumo de la receta",
)
def remove_receta_item(
    servicio_id: UUID,
    insumo_id:   UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> None:
    _get_servicio_or_404(session, servicio_id, especialista.id)
    item = session.exec(
        select(ServicioInsumo).where(
            ServicioInsumo.servicio_id == servicio_id,
            ServicioInsumo.insumo_id   == insumo_id,
        )
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo no encontrado en la receta")
    session.delete(item)
    session.commit()


# =============================================================================
# Helpers internos
# =============================================================================

def _get_insumo_or_404(session: Session, insumo_id: UUID, especialista_id: UUID) -> Insumo:
    insumo = session.exec(
        select(Insumo).where(Insumo.id == insumo_id, Insumo.especialista_id == especialista_id)
    ).first()
    if not insumo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo no encontrado")
    return insumo


def _get_servicio_or_404(session: Session, servicio_id: UUID, especialista_id: UUID) -> Servicio:
    servicio = session.exec(
        select(Servicio).where(Servicio.id == servicio_id, Servicio.especialista_id == especialista_id)
    ).first()
    if not servicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")
    return servicio


def _insumo_to_read(insumo: Insumo) -> InsumoRead:
    data = InsumoRead.model_validate(insumo)
    data.stock_bajo = insumo.stock_actual <= insumo.stock_minimo
    # Calcular costo por unidad individual (si es paquete)
    if insumo.unidades_por_paquete and insumo.unidades_por_paquete > 1:
        data.costo_por_unidad = round(insumo.costo_unitario / insumo.unidades_por_paquete, 4)
    else:
        data.costo_por_unidad = insumo.costo_unitario
    return data


def _servicio_to_read(session: Session, servicio: Servicio) -> ServicioRead:
    """Construye ServicioRead con receta + costo calculado + merma."""
    items = session.exec(
        select(ServicioInsumo).where(ServicioInsumo.servicio_id == servicio.id)
    ).all()

    insumos_read: List[ServicioInsumoRead] = []
    costo_total = 0.0
    for si in items:
        insumo = session.get(Insumo, si.insumo_id)
        if insumo:
            # IMPORTANTE: El costo se basa en el costo POR UNIDAD
            costo_unit = insumo.costo_unitario
            if insumo.unidades_por_paquete and insumo.unidades_por_paquete > 1:
                costo_unit = insumo.costo_unitario / insumo.unidades_por_paquete
            
            costo_linea = si.cantidad_utilizada * costo_unit
            costo_total += costo_linea
            insumos_read.append(
                ServicioInsumoRead(
                    insumo_id=si.insumo_id,
                    insumo_nombre=insumo.nombre,
                    insumo_unidad=insumo.unidad,
                    cantidad_utilizada=si.cantidad_utilizada,
                    costo_linea=round(costo_linea, 4),
                )
            )

    # Fase 9.1: Calcular merma (costos indirectos) como % del costo de insumos
    merma_pct = servicio.merma_porcentaje or 0.0
    costo_merma = round(costo_total * merma_pct / 100, 4)
    utilidad = round(servicio.precio - costo_total - costo_merma, 4)

    return ServicioRead(
        id=servicio.id,
        especialista_id=servicio.especialista_id,
        nombre=servicio.nombre,
        codigo=servicio.codigo,
        categoria=servicio.categoria,
        descripcion=servicio.descripcion,
        precio=servicio.precio,
        merma_porcentaje=merma_pct,
        activo=servicio.activo,
        costo_insumos=round(costo_total, 4),
        costo_merma=costo_merma,
        utilidad_neta=utilidad,
        insumos=insumos_read,
        created_at=servicio.created_at,
        updated_at=servicio.updated_at,
    )

