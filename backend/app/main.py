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
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.database import engine
from app.api import (
    auth, pacientes, odontograma, historias_clinicas, hc_secciones,
    inventario, citas, presupuestos, comunicaciones, dashboard,
    admin_auth, admin_especialistas, admin_planes, admin_dashboard, admin_config,
    admin_users, public_portal, adjuntos
)
from app.workers.mensajes_worker import start_scheduler, stop_scheduler


# ---------------------------------------------------------------------------
# Lifespan: arrancar y detener el scheduler de mensajes
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: startup → yield → shutdown."""
    start_scheduler()  
    yield
    stop_scheduler()


# ---------------------------------------------------------------------------
# Aplicación
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VitalNexus API",
    description="API multi-tenant para gestión médica con gestión de alta precisión",
    version="0.5.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Montar archivos estáticos (Logos públicos y adjuntos - Nota: Adjuntos están protegidos por API, pero logos necesitan ser estáticos)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(pacientes.router)
app.include_router(odontograma.router)
app.include_router(historias_clinicas.router)
app.include_router(hc_secciones.router)
app.include_router(inventario.router)
app.include_router(citas.router)
app.include_router(presupuestos.router)
app.include_router(comunicaciones.router)
app.include_router(dashboard.router)
app.include_router(adjuntos.router)

# Routers Admin (Fase 7)
app.include_router(admin_auth.router)
app.include_router(admin_especialistas.router)
app.include_router(admin_planes.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_config.router)
app.include_router(admin_users.router)

# Portal Público (Fase 9)
app.include_router(public_portal.router)


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
