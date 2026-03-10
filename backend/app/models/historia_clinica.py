"""
Modelo SQLModel — HistoriaClinica.
Fase 2.4: Historias Clínicas (tabla transaccional en sys_clinical).
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


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
    motivo_consulta:    Optional[str]  = Field(default=None)
    diagnostico:        Optional[str]  = Field(default=None)
    plan_tratamiento:   Optional[str]  = Field(default=None)
    notas:              Optional[str]  = Field(default=None)
    activo:             bool           = Field(default=True)
    created_at:         datetime       = Field(default_factory=datetime.utcnow)
    updated_at:         datetime       = Field(default_factory=datetime.utcnow)
