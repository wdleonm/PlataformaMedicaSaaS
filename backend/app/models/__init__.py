"""
Modelos SQLModel para Odonto-Focus.
Fase 1: Especialidades, Especialistas y relación N:N.
"""
from app.models.especialidad import Especialidad
from app.models.especialista import Especialista, EspecialistaEspecialidad

__all__ = ["Especialidad", "Especialista", "EspecialistaEspecialidad"]
