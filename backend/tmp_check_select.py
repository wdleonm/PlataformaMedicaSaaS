from sqlmodel import Session, select
from app.database import engine
from app.models.comunicaciones import ColaMensaje
from datetime import datetime, timezone

ahora = datetime.now(timezone.utc)
with Session(engine) as session:
    stmt = (
        select(ColaMensaje)
        .where(
            ColaMensaje.estado.in_(["pendiente", "fallido"]),
            ColaMensaje.reintentos < ColaMensaje.max_reintentos,
            ColaMensaje.proximo_intento <= ahora,
        )
    )
    res = session.exec(stmt).all()
    print(f"Ahra (UTC): {ahora}")
    print(f"Mensajes a procesar: {len(res)}")
    for m in res:
        print(f" - ID: {m.id}, Proximo Intento: {m.proximo_intento}, Estado: {m.estado}")
