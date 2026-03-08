"""
Punto de entrada FastAPI.
Fase 1: Configuración completa con CORS, routers y health check mejorado.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine
from app.api import auth, pacientes

app = FastAPI(
    title="Odonto-Focus API",
    description="API multi-tenant para gestión médica/odontológica",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(pacientes.router)


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
