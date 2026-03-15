from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from typing import List
from uuid import UUID

from app.database import get_session
from app.models.especialista import Especialista
from app.models.insumo_servicio import Servicio
from app.models.paciente import Paciente
from app.models.finanzas import Cita
from app.schemas.public import PublicSpecialistRead, PublicServiceRead, PublicReservaCreate

router = APIRouter(prefix="/api/public", tags=["Public Portal"])

@router.get("/p/{slug}", response_model=PublicSpecialistRead)
def get_public_profile(slug: str, session: Session = Depends(get_session)):
    """
    Obtiene el perfil público de un especialista por su slug.
    """
    # Buscamos al especialista por slug y que tenga el portal visible
    especialista = session.exec(
        select(Especialista).where(Especialista.slug_url == slug, Especialista.portal_visible == True)
    ).first()

    if not especialista:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Especialista no encontrado o portal no disponible."
        )

    # Obtenemos servicios públicos
    servicios = session.exec(
        select(Servicio).where(
            Servicio.especialista_id == especialista.id,
            Servicio.visible_publico == True,
            Servicio.activo == True
        )
    ).all()

    # Especialidades
    especialidades_nombres = [e.nombre for e in especialista.especialidades]

    return {
        "id": especialista.id,
        "nombre": especialista.nombre,
        "apellido": especialista.apellido,
        "descripcion_perfil": especialista.descripcion_perfil,
        "horario_atencion": especialista.horario_atencion,
        "especialidades": especialidades_nombres,
        "servicios": [
            {
                "id": s.id,
                "nombre": s.nombre,
                "precio": float(s.precio),
                "duracion_estimada_min": s.duracion_estimada_min
            } for s in servicios
        ]
    }

@router.post("/p/{slug}/reserva")
def create_public_reservation(
    slug: str, 
    data: PublicReservaCreate, 
    session: Session = Depends(get_session)
):
    """
    Registra un paciente (si no existe) y una cita desde el portal público.
    """
    especialista = session.exec(
        select(Especialista).where(Especialista.slug_url == slug, Especialista.portal_visible == True)
    ).first()

    if not especialista:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Especialista no disponible")

    # 1. Buscar o crear paciente por documento para este especialista
    # (Usamos orm para bypass RLS o seteamos el config temporalmente)
    session.execute(func.set_config("app.especialista_id", str(especialista.id), True))
    
    paciente = session.exec(
        select(Paciente).where(
            Paciente.documento == data.documento, 
            Paciente.especialista_id == especialista.id
        )
    ).first()

    if not paciente:
        paciente = Paciente(
            especialista_id=especialista.id,
            nombre=data.nombre,
            apellido=data.apellido,
            documento=data.documento,
            email=data.email,
            telefono=data.telefono,
            origen_registro="portal_publico"
        )
        session.add(paciente)
        session.flush() # Para obtener ID
    
    # 2. Crear la cita
    nueva_cita = Cita(
        especialista_id=especialista.id,
        paciente_id=paciente.id,
        servicio_id=data.servicio_id,
        fecha_hora=data.fecha_hora,
        estado="programada",
        notas=f"RESERVA ONLINE: {data.notas or ''}"
    )
    
    session.add(nueva_cita)
    session.commit()

    return {"status": "success", "message": "Cita agendada correctamente. El doctor confirmará su asistencia."}
@router.get("/recibo/{abono_id}")
def get_public_receipt(abono_id: UUID, session: Session = Depends(get_session)):
    """
    Obtiene los detalles de un abono (recibo) de forma pública.
    """
    from app.models.finanzas import Abono, Presupuesto
    from app.models.especialista import Especialista
    from app.models.paciente import Paciente

    abono = session.get(Abono, abono_id)
    if not abono:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")
    
    presupuesto = session.get(Presupuesto, abono.presupuesto_id)
    paciente = session.get(Paciente, presupuesto.paciente_id)
    especialista = session.get(Especialista, abono.especialista_id)

    return {
        "id": abono.id,
        "monto": float(abono.monto),
        "fecha": abono.fecha_abono,
        "metodo_pago": abono.metodo_pago,
        "notas": abono.notas,
        "paciente": {
            "nombre": f"{paciente.nombre} {paciente.apellido}",
            "documento": paciente.documento
        },
        "especialista": {
            "nombre": f"{especialista.nombre} {especialista.apellido}",
            "email": especialista.email
        },
        "presupuesto": {
            "total": float(presupuesto.total),
            "saldo_pendiente": float(presupuesto.saldo_pendiente),
            "estado": presupuesto.estado
        }
    }

@router.get("/presupuesto/{presupuesto_id}")
def get_public_budget(presupuesto_id: UUID, session: Session = Depends(get_session)):
    """
    Obtiene los detalles de un presupuesto de forma pública para vista de paciente.
    """
    from app.models.finanzas import Presupuesto, PresupuestoDetalle
    from app.models.especialista import Especialista
    from app.models.paciente import Paciente

    presupuesto = session.get(Presupuesto, presupuesto_id)
    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    
    paciente = session.get(Paciente, presupuesto.paciente_id)
    especialista = session.get(Especialista, presupuesto.especialista_id)
    detalles = session.exec(
        select(PresupuestoDetalle).where(PresupuestoDetalle.presupuesto_id == presupuesto.id)
    ).all()

    return {
        "id": presupuesto.id,
        "fecha": presupuesto.fecha,
        "total": float(presupuesto.total),
        "saldo_pendiente": float(presupuesto.saldo_pendiente),
        "estado": presupuesto.estado,
        "validez_fecha": presupuesto.validez_fecha,
        "notas": presupuesto.notas,
        "paciente": {
            "nombre": f"{paciente.nombre} {paciente.apellido}",
            "documento": paciente.documento
        },
        "especialista": {
            "nombre": f"{especialista.nombre} {especialista.apellido}",
            "email": especialista.email
        },
        "detalles": [
            {
                "id": d.id,
                "descripcion": d.descripcion,
                "cantidad": float(d.cantidad),
                "precio_unitario": float(d.precio_unitario),
                "subtotal": float(d.cantidad * d.precio_unitario)
            } for d in detalles
        ]
    }
