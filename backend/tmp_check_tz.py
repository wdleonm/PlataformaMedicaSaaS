from sqlmodel import Session, select
from app.database import engine
from app.models.comunicaciones import ColaMensaje
from datetime import datetime, timezone

ahora = datetime.now(timezone.utc)
with Session(engine) as session:
    msgs = session.exec(select(ColaMensaje).order_by(ColaMensaje.created_at.desc()).limit(5)).all()
    for m in msgs:
        print(f"ID: {m.id}, Proximo Intento: {m.proximo_intento}, Tz: {m.proximo_intento.tzinfo}, Estado: {m.estado}")
