# Backend - Odonto-Focus | FastAPI

## Fase 1: Core & Infra

### Requisitos

- Python 3.12+
- PostgreSQL 16+
- Docker (opcional, para desarrollo con docker-compose)

### Instalación local

1. Crear entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
```bash
cp ../.env.example .env
# Editar .env con tus valores (DATABASE_URL, JWT_SECRET, etc.)
```

### Base de datos

#### Opción 1: Usar el script SQL inicial

```bash
# Conectar a PostgreSQL y ejecutar:
psql -U plataforma_user -d plataforma_medica -f ../scripts/001_especialistas_especialidades_rls.sql
```

#### Opción 2: Usar Alembic (recomendado)

1. Crear la primera migración:
```bash
alembic revision --autogenerate -m "Initial: especialidades y especialistas con RLS"
```

2. Revisar la migración generada en `alembic/versions/`

3. Aplicar migraciones:
```bash
alembic upgrade head
```

### Ejecutar servidor

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará en: http://localhost:8000

- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Endpoints disponibles (Fase 1)

- `POST /api/auth/register` - Registro de especialista
- `POST /api/auth/login` - Login (retorna JWT)
- `GET /api/auth/me` - Obtener especialista actual (requiere token)

### Ejemplo de uso

#### 1. Registrar especialista

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr@ejemplo.com",
    "password": "password123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "especialidad_ids": []
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr@ejemplo.com",
    "password": "password123"
  }'
```

Respuesta:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "especialista": { ... }
}
```

#### 3. Obtener especialista actual (protegido)

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Docker

Ver `docker/README.md` en la raíz del proyecto para usar docker-compose.

### Notas sobre RLS

- El sistema usa PostgreSQL Row Level Security (RLS).
- Cada request autenticado ejecuta `SET LOCAL app.especialista_id = '<uuid>'` automáticamente.
- Las políticas RLS garantizan que cada especialista solo vea/modifique sus propios datos.
