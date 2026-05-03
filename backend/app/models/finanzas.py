"""
Modelos SQLModel — Citas y Presupuestos.
Fase 3.3: Citas/Consultas.
Fase 3.4: Presupuestos, PresupuestoDetalle y Abonos (Regla de Oro 3.3).
"""
from datetime import date, datetime, timezone
from typing import Optional, List
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship


# ---------------------------------------------------------------------------
# 3.3  Cita
# ---------------------------------------------------------------------------

ESTADOS_CITA = ("programada", "confirmada", "en_curso", "completada", "cancelada", "no_asistio")


class Cita(SQLModel, table=True):
    """Agenda de citas/consultas del especialista."""

    __tablename__  = "citas"
    __table_args__ = {"schema": "sys_clinical"}

    id:              UUID            = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID            = Field(foreign_key="sys_config.especialistas.id", index=True)
    paciente_id:     UUID            = Field(foreign_key="sys_clinical.pacientes.id",   index=True)
    servicio_id:     Optional[UUID]  = Field(default=None, foreign_key="sys_config.servicios.id")
    fecha_hora:      datetime        = Field()
    duracion_min:    Optional[int]   = Field(default=None, gt=0)
    presupuesto_id:  Optional[UUID]  = Field(default=None, foreign_key="sys_clinical.presupuestos.id", index=True)
    abono_id:        Optional[UUID]  = Field(default=None, foreign_key="sys_clinical.abonos.id")
    estado:          str             = Field(default="programada", max_length=20)
    monto_cobrado:   Optional[float] = Field(default=None, ge=0)
    costo_insumos:   Optional[float] = Field(default=None, ge=0)
    costo_merma:     Optional[float] = Field(default=None, ge=0)
    utilidad_neta:   Optional[float] = Field(default=None)
    notas:           Optional[str]   = Field(default=None)
    created_at:      datetime        = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:      datetime        = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# 3.4a  Presupuesto
# ---------------------------------------------------------------------------

ESTADOS_PRESUPUESTO = ("borrador", "aprobado", "en_pago", "pagado", "cancelado")


class Presupuesto(SQLModel, table=True):
    """Presupuesto de tratamiento. saldo_pendiente es mantenido por trigger en la BD."""

    __tablename__  = "presupuestos"
    __table_args__ = {"schema": "sys_clinical"}

    id:              UUID           = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID           = Field(foreign_key="sys_config.especialistas.id", index=True)
    paciente_id:     UUID           = Field(foreign_key="sys_clinical.pacientes.id",   index=True)
    fecha:           date           = Field(default_factory=date.today)
    total:           float          = Field(default=0.0, ge=0)
    saldo_pendiente: float          = Field(default=0.0, ge=0)
    estado:          str            = Field(default="borrador", max_length=20)
    validez_fecha:   Optional[date] = Field(default=None)
    notas:           Optional[str]  = Field(default=None)
    created_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relación con detalles
    detalles: List["PresupuestoDetalle"] = Relationship(
        back_populates="presupuesto", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


# ---------------------------------------------------------------------------
# 3.4b  PresupuestoDetalle
# ---------------------------------------------------------------------------

class PresupuestoDetalle(SQLModel, table=True):
    """Líneas del presupuesto. La BD calcula el subtotal automáticamente."""

    __tablename__  = "presupuesto_detalles"
    __table_args__ = {"schema": "sys_clinical"}

    id:              UUID           = Field(default_factory=uuid4, primary_key=True)
    presupuesto_id:  UUID           = Field(foreign_key="sys_clinical.presupuestos.id", index=True)
    servicio_id:     Optional[UUID] = Field(default=None, foreign_key="sys_config.servicios.id")
    descripcion:     Optional[str]  = Field(default=None, max_length=200)
    cantidad:        float          = Field(default=1.0)
    precio_unitario: float          = Field(default=0.0)
    # subtotal es GENERATED ALWAYS en la BD; se omite en el modelo para evitar conflictos
    # Se puede calcular en Python como: cantidad * precio_unitario

    # Relación inversa
    presupuesto: Optional[Presupuesto] = Relationship(back_populates="detalles")


# ---------------------------------------------------------------------------
# 3.4c  Abono
# ---------------------------------------------------------------------------

METODOS_PAGO = ("efectivo", "transferencia", "tarjeta_debito",
                "tarjeta_credito", "cheque", "otro")


class Abono(SQLModel, table=True):
    """
    Pago parcial o total de un presupuesto.
    Cada INSERT activa el trigger de la BD que actualiza presupuestos.saldo_pendiente.
    (Regla de Oro 3.3)
    """

    __tablename__  = "abonos"
    __table_args__ = {"schema": "sys_clinical"}

    id:              UUID           = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID           = Field(foreign_key="sys_config.especialistas.id", index=True)
    presupuesto_id:  UUID           = Field(foreign_key="sys_clinical.presupuestos.id", index=True)
    monto:           float          = Field(gt=0)
    fecha_abono:     date           = Field(default_factory=date.today)
    metodo_pago:     str            = Field(default="efectivo", max_length=30)
    cita_id:         Optional[UUID] = Field(default=None, foreign_key="sys_clinical.citas.id")
    notas:           Optional[str]  = Field(default=None)
    created_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# 3.4d  GastoFijo y CategoriaGasto
# ---------------------------------------------------------------------------

class CategoriaGasto(SQLModel, table=True):
    """
    Catálogo de categorías para gastos fijos (Alquiler, Luz, etc).
    Si especialista_id es NULL, es una categoría global/estándar.
    """
    __tablename__  = "categorias_gastos"
    __table_args__ = {"schema": "sys_clinical"}

    id:              UUID           = Field(default_factory=uuid4, primary_key=True)
    especialista_id: Optional[UUID] = Field(default=None, foreign_key="sys_config.especialistas.id", index=True)
    nombre:          str            = Field(max_length=100)
    descripcion:     Optional[str]  = Field(default=None)
    created_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))


class GastoFijo(SQLModel, table=True):
    """
    Gastos operativos mensuales (alquiler, luz, agua, secretaria, internet, etc).
    Permite calcular la utilidad neta real restando estos costos fijos de la utilidad de servicios.
    """

    __tablename__  = "gastos_fijos"
    __table_args__ = {"schema": "sys_clinical"}

    id:              UUID           = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID           = Field(foreign_key="sys_config.especialistas.id", index=True)
    categoria_id:    UUID           = Field(foreign_key="sys_clinical.categorias_gastos.id")
    descripcion:     Optional[str]  = Field(default=None)
    monto:           float          = Field(ge=0)
    fecha_pago:      date           = Field(default_factory=date.today)
    periodo_mes:     int            = Field(ge=1, le=12) # Mes del gasto
    periodo_anio:    int            = Field(ge=2000)     # Año del gasto
    es_recurrente:   bool           = Field(default=True)
    created_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relación para obtener el nombre de la categoría fácilmente
    categoria_rel: Optional[CategoriaGasto] = Relationship()
