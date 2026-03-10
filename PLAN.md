# PLAN.md — Odonto-Focus | SaaS Médico Multi-Tenant

**Fuente de verdad del proyecto.** No pasar a la siguiente fase sin aprobación del usuario.

---

## 1. Visión y Contexto General

| Principio | Detalle |
|-----------|---------|
| **Rol** | Arquitecto de Software Senior + Desarrollador Fullstack. Aplicación web para especialistas de salud (inicio: odontólogos). |
| **Aislamiento** | Multi-tenant basado en la columna `especialista_id` en todas las tablas operativas. |
| **Seguridad** | PostgreSQL Row Level Security (RLS) para confidencialidad entre especialistas. |
| **Identificadores** | UUID para todas las Primary Keys. |
| **Stack** | Backend: FastAPI (Python). Frontend: Next.js (App Router). DB: PostgreSQL. Despliegue: Docker en VPS (Easy Panel). |

**VPS:** IP 147.93.184.194 — usar en Fase 6 para configuración Easy Panel.

---

## 2. Regla de Gestión con Cursor

En cada respuesta, Cursor debe indicar:
- **Qué paso del PLAN.md** se está ejecutando.
- **Qué debe hacer el usuario** (revisar, aprobar, configurar env, etc.).
- **Qué hará Cursor automáticamente** (generar código, migraciones, tests, etc.).

---

## 3. Especificaciones Técnicas Críticas (Reglas de Oro)

### 3.1 Evolución clínica (Odontograma)
- La tabla **odontograma_registros** debe guardar: `paciente_id`, `numero_diente`, `cara_diente`, `hallazgo_id`, `fecha_registro`.
- **No sobreescribir:** siempre insertar nuevos registros para mantener el histórico.
- Permite reconstruir el estado del odontograma por fecha (evolutivo).

### 3.2 Rentabilidad automática
- Cada **servicio** tiene una "receta" de insumos (tabla servicio_insumos con cantidades).
- Al cobrar un servicio: **Utilidad_Neta = Precio_Cobrado - Suma(Costo_Insumos según receta)**.
- El sistema debe calcular y poder reportar esta utilidad por servicio/cita.

### 3.3 Gestión de deuda (planes de pago)
- Los planes de pago deben actualizar **saldo_pendiente** en tiempo real.
- Cada **abono** dispara: (1) actualización de saldo, (2) log de movimiento, (3) tarea futura de notificación (ej. WhatsApp).

### 3.4 Comunicaciones seguras (YCloud)
- Diseñar una tabla o cola **cola_mensajes** para la API de YCloud.
- Estados: `pendiente`, `enviado`, `leído` (y opcional `fallido`).
- Reintentos configurados; no perder mensajes críticos (abonos, recordatorios).

---

## 4. Fases del Plan

---

### Fase 1: Core & Infra

**Objetivo:** Dockerización, esquema de especialistas/especialidades y configuración de RLS.

#### 1.1 Docker y servicios
- [x] Definir `docker-compose.yml` (en `/docker` o raíz): postgres, backend (FastAPI), frontend (Next.js), redis (opcional).
- [x] Variables en `.env.example`: `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `YCLOUD_API_KEY` (sin valor; el usuario la añade localmente).
- [x] Backend: conexión a PostgreSQL (SQLAlchemy/SQLModel), health-check que verifique DB.

#### 1.2 Esquema base y RLS
- [x] Tabla **especialidades**: `id` (UUID), `nombre`, `codigo` (único), `activo`. Sin RLS (maestra compartida).
- [x] Tabla **especialistas**: `id` (UUID), `email` (único), `password_hash`, `nombre`, `apellido`, `activo`, `created_at`, `updated_at`. RLS: solo el propio especialista accede a su fila.
- [x] Tabla **especialista_especialidades** (N:N): `especialista_id`, `especialidad_id`. RLS por `especialista_id`.
- [x] Políticas RLS en PostgreSQL: habilitar RLS en tablas operativas; usar `current_setting('app.especialista_id')::uuid` (inyectado por backend en cada transacción).
- [x] Script SQL inicial creado (o migración Alembic): tablas + políticas.

#### 1.3 Autenticación mínima (para probar RLS)
- [x] Registro y login de especialistas; JWT con `sub = especialista_id`.
- [x] Middleware/dependency que inyecte `especialista_id` y ejecute `SET LOCAL app.especialista_id` en cada request a la DB.

#### Criterios de aceptación Fase 1
- Docker levanta Postgres y Backend; `/health` responde OK.
- Un especialista solo puede leer/editar sus propios datos y sus relaciones con especialidades.
- Script SQL (o migración) aplicado y documentado en el repo.

---

### Fase 2: Pacientes y Odontología

**Objetivo:** Modelado de pacientes y Odontograma Evolutivo (reconstruir estados por fecha).

#### 2.1 Pacientes
- [x] Tabla **pacientes**: `id` (UUID), `especialista_id` (FK), `nombre`, `apellido`, `documento`, `telefono`, `email`, `fecha_nacimiento`, `activo`, `created_at`, `updated_at`. RLS por `especialista_id`. → `scripts/002_pacientes.sql`
- [x] CRUD de pacientes (solo del especialista logueado). → `backend/app/api/pacientes.py`

#### 2.2 Catálogo de hallazgos (odontograma)
- [x] Tabla **odontograma_hallazgos** en `sys_config` (catálogo global, sin tenant): `codigo`, `nombre`, `categoria`, `descripcion_visual`, `activo`, `orden`. → `scripts/001_especialistas_especialidades_rls.sql`
- [x] Convención de dientes: FDI (11–18, 21–28, 31–38, 41–48 permanentes; 51–55, 61–65, 71–75, 81–85 temporales). Caras: O, M, D, V, L, R. Documentado en modelos y schemas.

#### 2.3 Odontograma evolutivo (Regla de Oro 3.1)
- [x] Tabla **odontograma_registros** en `sys_clinical`: `id`, `especialista_id`, `paciente_id`, `numero_diente`, `cara_diente`, `hallazgo_id`, `fecha_registro`, `notas`, `historia_clinica_id` (opcional), `created_at`. RLS por `especialista_id`. → `scripts/003_odontograma_registros_historias_clinicas.sql`
- [x] **Solo INSERT:** constraints y documentación en SQL y código Python garantizan que nunca se actualiza un registro existente.
- [x] Endpoints: `GET /api/pacientes/{id}/odontograma?fecha=YYYY-MM-DD`, `GET /api/pacientes/{id}/odontograma/historial`, `POST /api/odontograma/registros`, `GET /api/odontograma/hallazgos`. → `backend/app/api/odontograma.py`

#### 2.4 Historias clínicas
- [x] Tabla **historias_clinicas** en `sys_clinical`: `id`, `especialista_id`, `paciente_id`, `fecha_apertura`, `motivo_consulta`, `diagnostico`, `plan_tratamiento`, `notas`, `activo`, `created_at`, `updated_at`. RLS por `especialista_id`. → `scripts/003_odontograma_registros_historias_clinicas.sql`
- [x] CRUD completo (POST/GET/PATCH/DELETE lógico) con endpoints por paciente y por especialista. Vinculación con odontograma via `historia_clinica_id`. → `backend/app/api/historias_clinicas.py`

#### Criterios de aceptación Fase 2
- Pacientes CRUD con RLS. Odontograma con inserciones por diente/cara/hallazgo/fecha; consulta por fecha devuelve el estado correcto del odontograma en ese momento.

---

### Fase 3: Finanzas e Inventario

**Objetivo:** Gestión de insumos, relación costo/beneficio por servicio, presupuestos y planes de pago (cuotas).

#### 3.1 Insumos
- [x] Tabla **insumos** en `sys_config`: `id`, `especialista_id`, `nombre`, `codigo`, `unidad`, `costo_unitario`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`. RLS por `especialista_id`. → `scripts/004_finanzas_inventario.sql`
- [x] CRUD insumos con filtro `stock_bajo`. → `backend/app/api/inventario.py`

#### 3.2 Servicios y “receta” de insumos (Regla de Oro 3.2)
- [x] Tabla **servicios** en `sys_config`: `id`, `especialista_id`, `nombre`, `codigo`, `precio`, `activo`. RLS por `especialista_id`. → `scripts/004_finanzas_inventario.sql`
- [x] Tabla **servicio_insumos** en `sys_config`: `servicio_id`, `insumo_id`, `cantidad_utilizada`. Vista `v_rentabilidad_servicios` en BD. → `scripts/004_finanzas_inventario.sql`
- [x] Al completar una cita: **Utilidad_Neta = monto_cobrado − Costo_servicio** calculado desde receta. → `backend/app/api/citas.py`
- [x] Endpoints `PUT /api/servicios/{id}/receta` y `DELETE /api/servicios/{id}/receta/{insumo_id}`. → `backend/app/api/inventario.py`

#### 3.3 Citas/Consultas
- [x] Tabla **citas** en `sys_clinical`: `id`, `especialista_id`, `paciente_id`, `servicio_id`, `fecha_hora`, `duracion_min`, `estado`, `monto_cobrado`, `costo_insumos`, `utilidad_neta`, `notas`. RLS por `especialista_id`. → `scripts/004_finanzas_inventario.sql`
- [x] CRUD con filtros por paciente/estado/fecha y cálculo automático de utilidad al completar. → `backend/app/api/citas.py`

#### 3.4 Presupuestos y planes de pago (Regla de Oro 3.3)
- [x] Tabla **presupuestos** en `sys_clinical`: `id`, `especialista_id`, `paciente_id`, `fecha`, `total`, `saldo_pendiente`, `estado`, `validez_fecha`, `notas`. RLS. → `scripts/004_finanzas_inventario.sql`
- [x] Tabla **presupuesto_detalles**: `presupuesto_id`, `servicio_id`, `descripcion`, `cantidad`, `precio_unitario`, `subtotal` (GENERATED ALWAYS). Trigger recalcula `total` del presupuesto. → `scripts/004_finanzas_inventario.sql`
- [x] Tabla **abonos**: `id`, `especialista_id`, `presupuesto_id`, `monto`, `fecha_abono`, `metodo_pago`, `notas`. RLS. → `scripts/004_finanzas_inventario.sql`
- [x] **Trigger** `abonos_recalcular_saldo`: INSERT/UPDATE/DELETE en abonos → actualiza `saldo_pendiente` y `estado` del presupuesto en tiempo real. → `scripts/004_finanzas_inventario.sql`
- [x] CRUD completo de presupuestos, detalles y abonos. Validación de monto vs saldo. TODO Fase 4: encolar mensaje WhatsApp. → `backend/app/api/presupuestos.py`

#### Criterios de aceptación Fase 3
- CRUD insumos y servicios; receta de insumos por servicio; cálculo de utilidad por servicio/cita.
- Presupuestos con detalles; abonos actualizan saldo en tiempo real; cada abono prepara el disparo de notificación (cola en Fase 4).

---

### Fase 4: Comunicaciones (YCloud)

**Objetivo:** Integración WhatsApp para recordatorios y notificaciones de abonos.

#### 4.1 API YCloud
- [x] Documentado uso de la API YCloud (envío texto libre, webhook de estados). API Key en `.env` (no en repo); `.env.example` con placeholder `YCLOUD_API_KEY=` y `YCLOUD_WHATSAPP_NUMBER=`. → `backend/app/services/ycloud.py`
- [x] Servicio asincrónico en backend con `httpx`: envía mensaje a número E.164, reintentos gestionados por el worker, no en el servicio de envío.

#### 4.2 Cola de mensajes (Regla de Oro 3.4)
- [x] Tabla **cola_mensajes** en `sys_clinical`: `id`, `especialista_id`, `tipo`, `destino` (E.164), `payload` (JSONB), `estado` (`pendiente`, `enviado`, `leido`, `fallido`, `cancelado`), `reintentos`, `max_reintentos`, `ultimo_error`, refs a `abono_id`/`cita_id`, timestamps. RLS por `especialista_id`. → `scripts/005_cola_mensajes.sql`
- [x] Worker APScheduler (`procesar_cola` cada 2 min): procesa filas pendientes, llama `YCloudService.enviar_mensaje`, aplica **backoff exponencial** (`2^reintentos` minutos), actualiza estado y `reintentos`. Se inicia con el lifespan de FastAPI. → `backend/app/workers/mensajes_worker.py`

#### 4.3 Notificación al abonar
- [x] Al registrar un abono: se encola automáticamente un `ColaMensaje` tipo `abono_confirmacion` con payload `{paciente_nombre, moneda, monto, saldo_pendiente, fecha}`. Fallo de encolado es no-bloqueante (el abono ya está guardado). → `backend/app/api/presupuestos.py`

#### 4.4 Recordatorios de cita
- [x] Job APScheduler (`encolar_recordatorios_cita` cada 1 hora): busca citas en las próximas 24 h con estado `programada`/`confirmada`, verifica que no tengan recordatorio ya encolado, construye payload y encola `ColaMensaje` tipo `recordatorio_cita`. Solo encola si el paciente tiene teléfono registrado. → `backend/app/workers/mensajes_worker.py`

#### Criterios de aceptación Fase 4
- Envío de prueba vía YCloud. Abono registrado encola mensaje y se envía por WhatsApp. Cola con estados y reintentos operativa.

---

### Fase 5: Interfaz de Usuario

**Objetivo:** Dashboard, calendario y componente visual del odontograma.

#### 5.1 Estructura y Temática (Completado)
- [x] Template inicial: Next.js (App Router), Tailwind CSS, shadcn/ui.
- [x] Configuración de temas: CSS Variables para personalización por tenant y soporte a Dark Mode.
- [x] Glassmorphism y animaciones base premium con `framer-motion`.
- [x] `NEXT_PUBLIC_API_URL` apuntando al backend. Cliente HTTP con `Authorization: Bearer <token>`; manejo 401 (logout/redirect).
- [x] Login y registro de especialistas; contexto de usuario.

#### 5.2 Dashboard
- [x] Layout con menú: Inicio, Pacientes, Citas, Historias, Odontograma, Presupuestos/Abonos, Inventario, Configuración.
- [ ] Vista principal: resumen (pacientes, citas del día, abonos pendientes, alertas stock bajo).

#### 5.3 Calendario de citas
- [x] Vista calendario (semanal/mensual); listar y crear/editar citas; asociar paciente y servicio.

#### 5.4 Componente visual Odontograma
- [ ] Representación gráfica por diente/cara (FDI). Mostrar estado según fecha seleccionada (GET odontograma por fecha). Crear nuevos registros (POST) sin sobreescribir histórico.

#### 5.5 CRUD en UI
- [x] Pacientes.
- [x] Historias clínicas, presupuestos, abonos, insumos, servicios. Formulario de abono que dispare la notificación (cola en backend).

#### Criterios de aceptación Fase 5
- Navegación completa; calendario funcional; odontograma visual y evolutivo; flujos de negocio accesibles desde la UI.

---

### Fase 6: Despliegue

**Objetivo:** Configuración final para Easy Panel en el VPS.

#### 6.1 Docker Compose para producción
- [ ] `docker-compose.yml` listo para Easy Panel (postgres, backend, frontend, redis si aplica). Volúmenes para datos; variables desde entorno.
- [ ] IP VPS 147.93.184.194 documentada para cuando se configure dominio o acceso.

#### 6.2 Variables y secretos
- [ ] Todas las variables documentadas (README o PLAN). Usuario configura en Easy Panel; no subir `.env` con secretos. `.env.example` con `YCLOUD_API_KEY=` y resto.

#### 6.3 Base de datos y SSL
- [ ] Migraciones aplicadas al desplegar. Estrategia de backups (pg_dump, retención). SSL vía proxy reverso (Easy Panel / Nginx / Traefik).

#### Criterios de aceptación Fase 6
- `docker-compose up` (o despliegue en Easy Panel) levanta todos los servicios. App accesible; RLS y JWT operativos en producción.

---

## 5. Estructura de Carpetas del Monorepo

```
PlataformaMedicaSaaS/   (Odonto-Focus)
├── PLAN.md                 # Este documento (fuente de verdad)
├── .env.example             # Variables sin secretos; YCLOUD_API_KEY vacío
│
├── docker/                  # Orquestación y config de contenedores
│   ├── docker-compose.yml   # Servicios: postgres, backend, frontend, redis
│   └── README.md            # Instrucciones de uso
│
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   ├── services/
│   │   └── workers/
│   ├── alembic/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                # Next.js (App Router)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── contexts/
│   ├── Dockerfile
│   ├── package.json
│   └── ...
│
└── scripts/                 # Opcional: scripts SQL iniciales
    └── 001_especialistas_especialidades_rls.sql
```

---

## 6. Orden de Ejecución

- Trabajar **una fase a la vez**. No pasar a la siguiente sin aprobación del usuario.
- Ante dudas o detalles faltantes (ej. insumos, estados de cola), pedir: *"Actualiza el PLAN.md para incluir X"* y Cursor actualizará este archivo.
- Para empezar: *"Empecemos con la Fase 1: genera los archivos de Docker y la estructura de la base de datos"*.

---

*Documento: Odonto-Focus | Master Plan. Última actualización según Super Prompt (gestión vía PLAN.md, reglas de oro, 6 fases).*
