import asyncio
from app.workers.mensajes_worker import procesar_cola

async def run_once():
    print("Iniciando procesamiento manual de la cola...")
    await procesar_cola()
    print("Procesamiento finalizado. Revisa los resultados en la base de datos.")

if __name__ == "__main__":
    asyncio.run(run_once())
