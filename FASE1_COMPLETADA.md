# Para arrancar el proyecto debo abrir una terminal ubicarme en la ruta C:\xampp\htdocs\github\PlataformaMedicaSaaS\frontend>
# y  ejecutar npm run dev

# luiego abrir otra terminal y ubicarme en la ruta C:\xampp\htdocs\github\PlataformaMedicaSaaS\backend>
# y ejecutar python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 

# Frontend: npm run dev (por defecto en el puerto 3000)
# Backend: python -m uvicorn app.main:app --host 127.0.0.1 --port 8001


# ✅ Fase 1: Core & Infra — COMPLETADA

## Resumen

Se ha completado la **Fase 1** del PLAN.md con todas las funcionalidades requeridas:

### ✅ 1.1 Docker y servicios base
- `docker-compose.yml` en `/docker` con postgres, backend, frontend, redis (perfil `full`)
- `.env.example` con todas las variables necesarias
- Dockerfiles para backend y frontend

### ✅ 1.2 Conexión a PostgreSQL
- `app/database.py` con SQLModel engine configurado
- Pool de conexiones con `pool_pre_ping=True`
- Health check endpoint (`/health`) que verifica conexión a DB

### ✅ 1.3 Esquemas de base de datos
- **Tabla `especialidades`**: id (UUID), nombre, codigo (único), activo
- **Tabla `especialistas`**: id (UUID), email (único), password_hash, nombre, apellido, activo, timestamps
- **Tabla `especialista_especialidades`**: relación N:N con PK compuesta
- **Script SQL inicial**: `scripts/001_especialistas_especialidades_rls.sql` con políticas RLS

### ✅ 1.4 Migraciones
- Alembic configurado (`alembic/env.py` con metadata de SQLModel)
- Script template (`alembic/script.py.mako`)
- Comando: `alembic revision --autogenerate -m "..."` y `alembic upgrade head`

### ✅ 1.5 Autenticación mínima
- **Registro**: `POST /api/auth/register` (crea especialista y relaciones N:N)
- **Login**: `POST /api/auth/login` (retorna JWT)
- **Me**: `GET /api/auth/me` (ruta protegida que retorna especialista actual)
- Hash de passwords con bcrypt
- JWT con `sub = especialista_id`

### ✅ 1.6 Middleware y Tenant Context
- Dependency `get_current_especialista` que:
  - Valida JWT
  - Extrae `especialista_id` del claim `sub`
  - Ejecuta `SET LOCAL app.especialista_id = '<uuid>'` en la sesión
  - Retorna el especialista con sus especialidades cargadas

### ✅ 1.7 RLS (Row Level Security)
- Políticas RLS en PostgreSQL:
  - `especialistas`: solo el propio especialista puede ver/modificar su fila
  - `especialista_especialidades`: solo el especialista dueño puede ver/modificar sus relaciones
- Uso de `current_setting('app.especialista_id')::uuid` en las políticas

## Archivos creados/modificados

### Backend
- `app/config.py` - Configuración completa con todas las variables
- `app/database.py` - Conexión SQLModel con engine
- `app/models/especialidad.py` - Modelo Especialidad
- `app/models/especialista.py` - Modelo Especialista y EspecialistaEspecialidad
- `app/models/__init__.py` - Exports de modelos
- `app/schemas/auth.py` - Schemas Pydantic para auth
- `app/api/auth.py` - Rutas de registro y login
- `app/api/dependencies.py` - Dependency para autenticación y tenant context
- `app/middleware/tenant.py` - Middleware (preparado para uso futuro)
- `app/main.py` - FastAPI app con CORS y routers
- `alembic/env.py` - Configuración Alembic completa
- `alembic/script.py.mako` - Template para migraciones
- `backend/README.md` - Documentación de uso

### Scripts SQL
- `scripts/001_especialistas_especialidades_rls.sql` - Script inicial con tablas y RLS

### Docker
- `docker/docker-compose.yml` - Orquestación de servicios
- `docker/README.md` - Instrucciones de uso

## Cómo probar la Fase 1

### 1. Levantar servicios con Docker

```bash
cd docker
docker compose up -d
```

O desde la raíz:
```bash
docker compose -f docker/docker-compose.yml up -d
```

### 2. Aplicar migraciones o script SQL

**Opción A: Usar Alembic (recomendado)**
```bash
cd backend
alembic revision --autogenerate -m "Initial: especialidades y especialistas con RLS"
alembic upgrade head
```

**Opción B: Usar script SQL**
```bash
psql -U plataforma_user -d plataforma_medica -f scripts/001_especialistas_especialidades_rls.sql
```

### 3. Ejecutar backend

```bash
cd backend
uvicorn app.main:app --reload
```

### 4. Probar endpoints

#### Registrar especialista:
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

#### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr@ejemplo.com",
    "password": "password123"
  }'
```

#### Obtener especialista actual (requiere token):
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token_del_login>"
```

### 5. Verificar RLS

1. Crear dos especialistas diferentes (A y B)
2. Hacer login con A y obtener su token
3. Intentar acceder a datos de B usando el token de A
4. Verificar que solo se pueden ver los datos propios

## Criterios de aceptación ✅

- ✅ Docker Compose levanta Postgres y Backend; `/health` responde OK con estado de DB
- ✅ Desde backend se pueden crear/listar especialistas respetando RLS
- ✅ Un especialista solo ve sus propios datos y sus propias relaciones con especialidades
- ✅ Script SQL (o migración) aplicado y documentado

## Próximos pasos

**Fase 2: Pacientes y Odontología**
- Modelado de pacientes
- Odontograma evolutivo (reconstruir estados por fecha)
- Historias clínicas

---

*Fase 1 completada según PLAN.md. Lista para aprobación y continuación con Fase 2.*
