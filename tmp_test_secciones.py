import sys
import os
import json
from sqlmodel import Session, select
sys.path.append(r"c:\xampp\htdocs\github\PlataformaMedicaSaaS\backend")
from app.database import engine
from app.models.hc_seccion import HCSeccion, EspecialidadHCSeccion
from app.models.especialidad import Especialidad

with Session(engine) as session:
    especialidad = session.exec(select(Especialidad).where(Especialidad.codigo == 'MED_INT')).first()
    if not especialidad:
        print("No MED_INT")
        sys.exit()
    rels = session.exec(select(EspecialidadHCSeccion).where(EspecialidadHCSeccion.especialidad_id == especialidad.id)).all()
    secs = []
    for r in rels:
        s = session.get(HCSeccion, r.hc_seccion_id)
        secs.append(s.codigo)
    print("MED_INT sections:", secs)
