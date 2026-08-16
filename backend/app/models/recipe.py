from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
import random
import string

from sqlmodel import SQLModel, Field

def generate_qr_token() -> str:
    # 16-char random alphanumeric token
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=16))

class RecipeBase(SQLModel):
    paciente_id: UUID = Field(foreign_key="sys_clinical.pacientes.id", index=True)
    historia_clinica_id: Optional[UUID] = Field(default=None, foreign_key="sys_clinical.historias_clinicas.id", index=True)
    medicamentos: Optional[str] = Field(default=None)
    indicaciones: Optional[str] = Field(default=None)
    notas_adicionales: Optional[str] = Field(default=None)

class Recipe(RecipeBase, table=True):
    __tablename__ = "recipes"
    __table_args__ = {"schema": "sys_clinical"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID = Field(foreign_key="sys_config.especialistas.id", index=True)
    fecha_emision: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    qr_token: str = Field(default_factory=generate_qr_token, unique=True, index=True)
    activo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecipeCreate(RecipeBase):
    pass

class RecipeRead(RecipeBase):
    id: UUID
    especialista_id: UUID
    fecha_emision: datetime
    qr_token: str
    activo: bool
    created_at: datetime
    updated_at: datetime

class RecipeUpdate(SQLModel):
    medicamentos: Optional[str] = None
    indicaciones: Optional[str] = None
    notas_adicionales: Optional[str] = None
    activo: Optional[bool] = None
