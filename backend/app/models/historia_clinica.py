"""
Modelo SQLModel — HistoriaClinica.
Fase 2.4: Historias Clínicas (tabla transaccional en sys_clinical).
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, JSON
from sqlalchemy import Column


class HistoriaClinica(SQLModel, table=True):
    """
    Historia / episodio clínico de un paciente.
    Puede existir múltiples historias por paciente (una por consulta/episodio).
    """

    __tablename__ = "historias_clinicas"
    __table_args__ = {"schema": "sys_clinical"}

    id:                 UUID           = Field(default_factory=uuid4, primary_key=True)
    especialista_id:    UUID           = Field(
                                            foreign_key="sys_config.especialistas.id",
                                            index=True,
                                        )
    paciente_id:        UUID           = Field(
                                            foreign_key="sys_clinical.pacientes.id",
                                            index=True,
                                        )
    fecha_apertura:     date           = Field(default_factory=date.today)
    
    # Imagen 1: Motivo de consulta y Enfermedad Actual
    motivo_consulta:    Optional[str]  = Field(default=None) # Puede ser CSV o JSON
    enfermedad_actual:  Optional[str]  = Field(default=None)
    
    # Imagen 1: Antecedentes Familiares (JSONB)
    # { padre: { vivo: bool, patologias: [] }, madre: { viva: bool, patologias: [] } }
    antecedentes_familiares: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
    # Imagen 2: Antecedentes Personales (JSONB)
    # { patologias: [], especifique: str, medicamentos: str }
    antecedentes_personales: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
    # Imagen 2: Examen Clínico (JSONB)
    # { encias, carrillos, paladar_duro, lengua, paladar_blando, piso_boca, observaciones }
    examen_clinico: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
    # Imagen 2: Estudios Complementarios (JSONB)
    # { radiograficos: [], observaciones_estudio: str, laboratorios: str }
    estudios_complementarios: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    diagnostico:        Optional[str]  = Field(default=None)
    plan_tratamiento:   Optional[str]  = Field(default=None)
    notas:              Optional[str]  = Field(default=None)
    
    activo:             bool           = Field(default=True)
    created_at:         datetime       = Field(default_factory=datetime.utcnow)
    updated_at:         datetime       = Field(default_factory=datetime.utcnow)
