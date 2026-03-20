import asyncio
from sqlmodel import Session, select
from app.database import engine
from app.models.comunicaciones import ColaMensaje
from app.workers.mensajes_worker import procesar_cola
from datetime import datetime, timezone

async def run_once():
    print("--- DIAGNÓSTICO DE COLA ---")
    ahora = datetime.now(timezone.utc)
    print(f"Hora actual del servidor (UTC): {ahora}")
    
    with Session(engine) as session:
        # Forzar todos los pendientes al pasado absoluto para la prueba
        session.execute(select(ColaMensaje).where(ColaMensaje.estado == "pendiente"))
        msgs = session.exec(select(ColaMensaje).where(ColaMensaje.estado == "pendiente")).all()
        print(f"Mensajes pendientes detectados: {len(msgs)}")
        
        for m in msgs:
            # Forzamos proximo_intento a hace 1 hora para asegurar selección
            m.proximo_intento = ahora.replace(hour=ahora.hour-1 if ahora.hour > 0 else 0)
            session.add(m)
        session.commit()
    
    print("\n--- INICIANDO PROCESAMIENTO ---")
    await procesar_cola()
    print("\nProcesamiento finalizado. Revisa los resultados en la base de datos.")

if __name__ == "__main__":
    asyncio.run(run_once())
