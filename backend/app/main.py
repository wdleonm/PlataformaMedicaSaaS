"""
Punto de entrada FastAPI.
Fase 1: Configuración completa con CORS, routers y health check mejorado.
Fase 2: Odontograma evolutivo e historias clínicas.
Fase 3: Inventario (insumos/servicios), Citas y Presupuestos/Abonos.
Fase 4: Cola de mensajes YCloud y worker de notificaciones.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.api import auth, pacientes, odontograma, historias_clinicas, inventario, citas, presupuestos, comunicaciones
from app.workers.mensajes_worker import start_scheduler, stop_scheduler


# ---------------------------------------------------------------------------
# Lifespan: arrancar y detener el scheduler de mensajes
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: startup → yield → shutdown."""
    # start_scheduler()  # Comentado temporalmente para estabilidad en Windows
    yield
    # stop_scheduler()


# ---------------------------------------------------------------------------
# Aplicación
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Odonto-Focus API",
    description="API multi-tenant para gestión médica/odontológica con notificaciones WhatsApp",
    version="0.4.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todo temporalmente para depurar
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(pacientes.router)
app.include_router(odontograma.router)
app.include_router(historias_clinicas.router)
app.include_router(inventario.router)
app.include_router(citas.router)
app.include_router(presupuestos.router)
app.include_router(comunicaciones.router)


@app.get("/health")
def health():
    """
    Health check para Docker y Easy Panel.
    Verifica conexión a PostgreSQL.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e),
        }, 503
