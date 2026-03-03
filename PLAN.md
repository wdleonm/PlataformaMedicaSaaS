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
- [ ] Definir `docker-compose.yml` (en `/docker` o raíz): postgres, backend (FastAPI), frontend (Next.js), redis (opcional).
- [ ] Variables en `.env.example`: `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `YCLOUD_API_KEY` (sin valor; el usuario la añade localmente).
- [ ] Backend: conexión a PostgreSQL (SQLAlchemy/SQLModel), health-check que verifique DB.

#### 1.2 Esquema base y RLS
- [ ] Tabla **especialidades**: `id` (UUID), `nombre`, `codigo` (único), `activo`. Sin RLS (maestra compartida).
- [ ] Tabla **especialistas**: `id` (UUID), `email` (único), `password_hash`, `nombre`, `apellido`, `activo`, `created_at`, `updated_at`. RLS: solo el propio especialista accede a su fila.
- [ ] Tabla **especialista_especialidades** (N:N): `especialista_id`, `especialidad_id`. RLS por `especialista_id`.
- [ ] Políticas RLS en PostgreSQL: habilitar RLS en tablas operativas; usar `current_setting('app.especialista_id')::uuid` (inyectado por backend en cada transacción).
- [ ] Script SQL inicial creado (o migración Alembic): tablas + políticas.

#### 1.3 Autenticación mínima (para probar RLS)
- [ ] Registro y login de especialistas; JWT con `sub = especialista_id`.
- [ ] Middleware/dependency que inyecte `especialista_id` y ejecute `SET LOCAL app.especialista_id` en cada request a la DB.

#### Criterios de aceptación Fase 1
- Docker levanta Postgres y Backend; `/health` responde OK.
- Un especialista solo puede leer/editar sus propios datos y sus relaciones con especialidades.
- Script SQL (o migración) aplicado y documentado en el repo.

---

### Fase 2: Pacientes y Odontología

**Objetivo:** Modelado de pacientes y Odontograma Evolutivo (reconstruir estados por fecha).

#### 2.1 Pacientes
- [ ] Tabla **pacientes**: `id` (UUID), `especialista_id` (FK), `nombre`, `apellido`, `documento`, `telefono`, `email`, `fecha_nacimiento`, `activo`, `created_at`, `updated_at`. RLS por `especialista_id`.
- [ ] CRUD de pacientes (solo del especialista logueado).

#### 2.2 Catálogo de hallazgos (odontograma)
- [ ] Tabla **hallazgos** (o `odontograma_hallazgos`): `id` (UUID), `especialista_id` (opcional; si es por tenant) o global, `codigo`, `nombre`, `descripcion`, `activo`. Ejemplos: sano, caries, obturado, extracción indicada. RLS si es por tenant.
- [ ] Convención de dientes: FDI (11–18, 21–28, 31–38, 41–48). Caras: Oclusal (O), Mesial (M), Distal (D), Vestibular (V), Lingual (L). Documentar en PLAN o en código.

#### 2.3 Odontograma evolutivo (Regla de Oro 3.1)
- [ ] Tabla **odontograma_registros**: `id` (UUID), `especialista_id` (FK), `paciente_id` (FK), `numero_diente` (ej. 11–48), `cara_diente` (O, M, D, V, L), `hallazgo_id` (FK), `fecha_registro`, `notas` (opcional), `created_at`. RLS por `especialista_id`.
- [ ] **Solo INSERT:** no actualizar registros existentes; cada cambio de estado es una nueva fila. Así se reconstruye el estado por fecha.
- [ ] Endpoints: `GET /api/pacientes/{id}/odontograma?fecha=YYYY-MM-DD` (estado en esa fecha), `POST /api/odontograma/registros` (nuevo registro).

#### 2.4 Historias clínicas
- [ ] Tabla **historias_clinicas**: `id`, `especialista_id`, `paciente_id`, `fecha_apertura`, `motivo_consulta`, `diagnostico`, `plan_tratamiento`, `notas`, `activo`, `created_at`, `updated_at`. RLS por `especialista_id`.
- [ ] CRUD historias; opcional: vincular registros de odontograma a una historia (campo `historia_clinica_id` en `odontograma_registros` si se desea).

#### Criterios de aceptación Fase 2
- Pacientes CRUD con RLS. Odontograma con inserciones por diente/cara/hallazgo/fecha; consulta por fecha devuelve el estado correcto del odontograma en ese momento.

---

### Fase 3: Finanzas e Inventario

**Objetivo:** Gestión de insumos, relación costo/beneficio por servicio, presupuestos y planes de pago (cuotas).

#### 3.1 Insumos
- [ ] Tabla **insumos**: `id` (UUID), `especialista_id`, `nombre`, `codigo`, `unidad`, `costo_unitario`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`. RLS por `especialista_id`.
- [ ] CRUD insumos.

#### 3.2 Servicios y “receta” de insumos (Regla de Oro 3.2)
- [ ] Tabla **servicios**: `id` (UUID), `especialista_id`, `nombre`, `codigo`, `precio`, `activo`, `created_at`, `updated_at`. RLS por `especialista_id`.
- [ ] Tabla **servicio_insumos**: `servicio_id`, `insumo_id`, `cantidad_utilizada`. Permite: Costo_servicio = Σ (cantidad_utilizada × costo_unitario del insumo). RLS implícito vía servicio.
- [ ] Al cobrar un servicio: **Utilidad_Neta = Precio_Cobrado - Costo_servicio** (calculado o persistido por cita/servicio).

#### 3.3 Citas/Consultas
- [ ] Tabla **citas**: `id`, `especialista_id`, `paciente_id`, `fecha_hora`, `servicio_id` (opcional), `estado`, `monto_cobrado`, `notas`, `created_at`, `updated_at`. RLS por `especialista_id`.
- [ ] Permite asociar cobro a servicio y calcular utilidad por cita.

#### 3.4 Presupuestos y planes de pago (Regla de Oro 3.3)
- [ ] Tabla **presupuestos**: `id`, `especialista_id`, `paciente_id`, `fecha`, `total`, `saldo_pendiente` (actualizado en tiempo real), `estado`, `validez_fecha`, `notas`, `created_at`, `updated_at`. RLS por `especialista_id`.
- [ ] Tabla **presupuesto_detalles**: `presupuesto_id`, `servicio_id`, `cantidad`, `precio_unitario`, `subtotal`. RLS vía presupuesto.
- [ ] Tabla **abonos**: `id`, `especialista_id`, `presupuesto_id`, `monto`, `fecha_abono`, `metodo_pago`, `notas`, `created_at`. RLS por `especialista_id`.
- [ ] Al insertar un abono: (1) actualizar `presupuestos.saldo_pendiente = total - SUM(abonos.monto)`, (2) registrar log si se desea, (3) disparar tarea de notificación (Fase 4).
- [ ] Trigger o lógica en backend para mantener `saldo_pendiente` consistente.

#### Criterios de aceptación Fase 3
- CRUD insumos y servicios; receta de insumos por servicio; cálculo de utilidad por servicio/cita.
- Presupuestos con detalles; abonos actualizan saldo en tiempo real; cada abono prepara el disparo de notificación (cola en Fase 4).

---

### Fase 4: Comunicaciones (YCloud)

**Objetivo:** Integración WhatsApp para recordatorios y notificaciones de abonos.

#### 4.1 API YCloud
- [ ] Documentar uso de la API (envío de mensajes, webhooks). API Key en `.env` (no en repo); `.env.example` con placeholder `YCLOUD_API_KEY=`.
- [ ] Servicio en backend: enviar mensaje a un número (formato internacional). Reintentos según documentación YCloud.

#### 4.2 Cola de mensajes (Regla de Oro 3.4)
- [ ] Tabla **cola_mensajes** (o equivalente en Redis + persistencia): `id` (UUID), `especialista_id`, `tipo` (ej. `abono_confirmacion`, `recordatorio_cita`), `destino` (teléfono), `payload` (JSON), `estado` (`pendiente`, `enviado`, `leído`, `fallido`), `reintentos`, `max_reintentos`, `ultimo_error`, `created_at`, `enviado_at`, `leido_at`. RLS por `especialista_id`.
- [ ] Worker (o tarea programada) que procesa filas `estado = pendiente`, llama a YCloud, actualiza estado y reintentos.

#### 4.3 Notificación al abonar
- [ ] Al registrar un abono (Fase 3): insertar en **cola_mensajes** tipo `abono_confirmacion` con payload: monto abonado, saldo pendiente, fecha. Mensaje: "Monto abonado: X. Saldo pendiente: Y. Fecha: Z."

#### 4.4 Recordatorios de cita
- [ ] Tarea programada (cron/Celery Beat): buscar citas próximas (ej. 24h) y encolar mensajes tipo `recordatorio_cita` con fecha/hora y datos del paciente.

#### Criterios de aceptación Fase 4
- Envío de prueba vía YCloud. Abono registrado encola mensaje y se envía por WhatsApp. Cola con estados y reintentos operativa.

---

### Fase 5: Interfaz de Usuario

**Objetivo:** Dashboard, calendario y componente visual del odontograma.

#### 5.1 Next.js base
- [ ] App Router, Tailwind, Shadcn/UI. `NEXT_PUBLIC_API_URL` apuntando al backend. Cliente HTTP con `Authorization: Bearer <token>`; manejo 401 (logout/redirect).
- [ ] Login y registro de especialistas; contexto de usuario.

#### 5.2 Dashboard
- [ ] Layout con menú: Inicio, Pacientes, Citas, Historias, Odontograma, Presupuestos/Abonos, Inventario, Configuración.
- [ ] Vista principal: resumen (pacientes, citas del día, abonos pendientes, alertas stock bajo).

#### 5.3 Calendario de citas
- [ ] Vista calendario (semanal/mensual); listar y crear/editar citas; asociar paciente y servicio.

#### 5.4 Componente visual Odontograma
- [ ] Representación gráfica por diente/cara (FDI). Mostrar estado según fecha seleccionada (GET odontograma por fecha). Crear nuevos registros (POST) sin sobreescribir histórico.

#### 5.5 CRUD en UI
- [ ] Pacientes, historias clínicas, presupuestos, abonos, insumos, servicios. Formulario de abono que dispare la notificación (cola en backend).

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
