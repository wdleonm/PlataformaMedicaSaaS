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
- [x] Layout con menú lateral: Pacientes, Citas, Historias Clínicas, Presupuestos, Inventario, Comunicaciones, Configuración. (Odontograma removido del menú principal — integrado en historia clínica).
- [x] Vista principal con **datos reales** del backend: KPIs (Pacientes Activos, Citas de Hoy, Ingresos del Mes, Insumos Críticos). Agenda de hoy con estado de cada cita. Pacientes recientes con link directo a su historia. Accesos rápidos a módulos. Stats adicionales (Citas semana, Historias clínicas, Por cobrar).
- [x] Diseño premium glassmorphism con animaciones framer-motion, colores semánticos por categoría y responsive para todas las vistas.
- [x] `NEXT_PUBLIC_API_URL` configurado en `.env.local` (necesario para que los fetch del dashboard funcionen). Creado `.env.local` con `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001`.

#### 5.3 Calendario de citas
- [x] Vista calendario (semanal/mensual); listar y crear/editar citas; asociar paciente y servicio.

#### 5.4 Componente visual Odontograma
- [x] Representación gráfica por diente/cara (FDI). Mostrar estado según fecha seleccionada. Crear registros sin sobreescribir histórico.
- [x] **Layout FDI completo (4 filas):** Permanentes superiores (18-11 | 21-28) → Temporales superiores (55-51 | 61-65) → Temporales inferiores (85-81 | 71-75) → Permanentes inferiores (48-41 | 31-38).
- [x] Paleta de hallazgos en **barra horizontal** sobre los dientes (Patologías / Restauraciones / Estados). Banner animado de "Modo Registro activo" al seleccionar un hallazgo.
- [x] Odontograma integrado en el **paso 4 de la Historia Clínica** (entre Examen Físico y Plan). Acceso desde el modal sin necesidad de menú lateral separado.
- [x] Página embed dedicada `/embed/odontograma` (fuera del grupo `(dashboard)`) que se carga en iframe **sin sidebar, logo ni menú hamburguesa**. Soluciona conflicto de layout.
- [x] Botón "Abrir pantalla completa" abre `/embed/odontograma` en nueva pestaña con todo el espacio disponible.

#### 5.5 CRUD en UI
- [x] Pacientes.
- [x] Historias clínicas multi-paso (Consulta → Antecedentes → Examen Físico → Odontograma → Plan).
- [x] Presupuestos, abonos, insumos, servicios. Formulario de abono que dispara notificación (cola en backend).

#### Criterios de aceptación Fase 5
- Navegación completa; calendario funcional; odontograma visual FDI evolutivo integrado en historia clínica; flujos de negocio accesibles desde la UI. **✅ Criterios cumplidos.**

---

### Mejoras y Correcciones UI (Sesión 11/03/2026)

**Problemas resueltos:**
- [x] Modal de "Editar Historia Clínica" recortado a la izquierda → solución: `createPortal` para renderizar fuera del layout.
- [x] Error `TS2322` en `dashboard/page.tsx` con `ease: "easeOut"` de framer-motion → solución: `as const`.
- [x] Tres errores ESLint: comillas sin escapar en `comunicaciones/page.tsx` (→ `&ldquo;&rdquo;`) y referencia a regla TypeScript inexistente en `page.tsx` (→ `catch (_err)`).
- [x] Error React en `embed/odontograma`: `<title>` dentro de `<path>` SVG siendo tratado como metadata del documento → eliminado, número visible encima de cada pieza.
- [x] Logo y menú hamburguesa apareciendo dentro del iframe del odontograma → creada ruta `/embed/odontograma` fuera del grupo `(dashboard)`.
- [x] Scrollbar visible en la barra de tabs del ---

### Fase 6: Historia Clínica Modular por Especialidad

**Objetivo:** Hacer que el sistema sea utilizable por múltiples especialidades médicas además de la odontología, sin reescribir la lógica existente. Las secciones de la historia clínica se configuran dinámicamente según la especialidad del especialista logueado.

> **Contexto:** Hoy el sistema es solo para odontólogos (maxilofaciales, ortodoncistas, etc.). Un cardiólogo no necesita odontograma, pero sí electrocardiograma. Un traumálogo necesita radiografías. Los datos básicos (consulta, antecedentes, examen físico, plan) pueden coincidir en nombre pero su contenido varía por especialidad.

#### 6.1 Modelo de datos: Catálogo de secciones
- [ ] Añadir tabla **`hc_secciones`** en `sys_config`: `id` (UUID), `codigo` (único, ej. `ODONTOGRAMA`, `ECG`, `RADIOGRAFIA`, `EXAMEN_FISICO`), `nombre`, `descripcion`, `componente_frontend` (nombre del componente Next.js a renderizar), `activo`. Sin RLS (catálogo global compartido). → `scripts/006_hc_modular.sql`
- [ ] Tabla **`especialidad_hc_secciones`** (N:N): `especialidad_id` (FK `sys_config.especialidades`), `hc_seccion_id` (FK `hc_secciones`), `orden` (para definir el orden en el modal), `obligatoria` (bool). Sin RLS. → `scripts/006_hc_modular.sql`
- [ ] **Poblar con especialidad odontología** (primer seed): secciones `CONSULTA` (orden 1), `ANTECEDENTES` (2), `EXAMEN_FISICO` (3), `ODONTOGRAMA` (4), `PLAN` (5). La sección `ODONTOGRAMA` queda marcada como exclusiva de odontología.
- [ ] Añadir columna `especialidad_id` a **`sys_clinical.historias_clinicas`** para identificar a qué especialidad pertenece cada historia. Migrar registros existentes con la especialidad de odontología.

#### 6.2 Backend: endpoints de configuración modular
- [ ] `GET /api/especialidades/{id}/hc-secciones` → retorna las secciones ordenadas para una especialidad (usado por el frontend para construir el modal dinámicamente).
- [ ] `GET /api/hc-secciones` → listado completo del catálogo (para administración).
- [ ] Endpoints CRUD para el catálogo de secciones y para la asignación especialidad ↔ secciones. → `backend/app/api/hc_secciones.py`
- [ ] Al crear o editar una historia clínica, el endpoint valida que el `especialista_id` sea de una especialidad que incluya las secciones enviadas.

#### 6.3 Frontend: modal dinámico de Historia Clínica
- [ ] El modal de Historia Clínica (`historias/page.tsx`) deja de tener los pasos hardcodeados. Al abrirse, llama a `GET /api/especialidades/{id}/hc-secciones` y construye los tabs y el contenido dinámicamente.
- [ ] Cada sección tiene un `componente_frontend` (string), el modal hace un map de string → componente React:
  ```
  CONSULTA        → <ConsultaStep />
  ANTECEDENTES    → <AntecedentesStep />
  EXAMEN_FISICO   → <ExamenFisicoStep />
  ODONTOGRAMA     → <OdontogramaStep /> (iframe a /embed/odontograma)
  PLAN            → <PlanStep />
  ECG             → <ElectrocardiogramaStep /> (futuro)
  RADIOGRAFIA     → <RadiografiasStep /> (futuro)
  ```
- [ ] El especialista logueado siempre ve solo las secciones de su especialidad. Nunca ve secciones irrelevantes.
- [ ] Los datos de cada sección se almacenan en `historias_clinicas` (campos genéricos JSON o columnas por sección según se defina en 6.1).

#### 6.4 Datos específicos por especialidad (futuro, post-odontología)
- [ ] Para cardiología: sección `ECG` con campos específicos (ritmo, frecuencia, observaciones). Componente `<ElectrocardiogramaStep />`.
- [ ] Para traumatología: sección `RADIOGRAFIA` con carga de imágenes y observaciones. Componente `<RadiografiasStep />`.
- [ ] Las especialidades se registran en `sys_config.especialidades` (ya existe); solo se añaden las secciones correspondientes.

#### Criterios de aceptación Fase 6
- El modal de Historia Clínica construye sus pasos desde la BD, no desde código hardcodeado.
- Un especialista de odontología ve: Consulta, Antecedentes, Examen Físico, Odontograma, Plan.
- Un futuro especialista de cardiología vería: Consulta, Antecedentes, Examen Físico, ECG, Plan (sin Odontograma).
- La especialidad queda registrada en cada historia clínica.

---

### Fase 7: Panel de Administración SaaS

**Objetivo:** Crear un panel separado (ruta `/admin`) donde el dueño del sistema pueda registrar especialistas, gestionar suscripciones y monitorear la plataforma. Este panel es completamente independiente del dashboard del especialista.

> **Contexto:** El dueño del sistema vende suscripciones a especialistas. Él los registra, les configura el acceso y controla el plan contratado. Los especialistas ya existen en `sys_config.especialistas`; solo se necesita enriquecer esa tabla y crear las de administración.

#### 7.1 Arquitectura de esquemas de BD

**Decisión de arquitectura:** Los datos de administración van en el mismo esquema `sys_config` (no se crea un esquema `sys_admin` separado). Justificación: son tablas de configuración del sistema, el esquema `sys_config` ya existe y aplica. Se mantiene la convención: `sys_config` = configuración global, `sys_clinical` = datos clínicos de pacientes.

- [ ] Añadir campos a **`sys_config.especialistas`**: `plan_suscripcion` (VARCHAR: `'basico'`, `'profesional'`, `'enterprise'`), `suscripcion_activa` (bool, default true), `fecha_vencimiento_suscripcion` (DATE), `notas_admin` (TEXT). → `scripts/007_admin_suscripciones.sql`
- [ ] Tabla **`sys_config.planes_suscripcion`**: `id`, `codigo` (único: `basico`, `profesional`, `enterprise`), `nombre`, `precio_mensual`, `max_pacientes`, `max_citas_mes`, `incluye_whatsapp` (bool), `incluye_multiusuario` (bool), `activo`. → `scripts/007_admin_suscripciones.sql`
- [ ] Tabla **`sys_config.log_suscripciones`**: `id`, `especialista_id`, `cambio` (JSON: `{de: 'basico', a: 'profesional'}`), `motivo`, `admin_id`, `created_at`. Para auditoría de cambios de plan. → `scripts/007_admin_suscripciones.sql`
- [ ] Tabla **`sys_config.administradores`**: `id` (UUID), `email` (único), `password_hash`, `nombre`, `apellido`, `activo`, `created_at`. **Sin RLS** (acceso global). JWT separado con `rol = 'admin'`. → `scripts/007_admin_suscripciones.sql`

#### 7.2 Backend: API de administración
- [ ] Autenticación admin: `POST /api/admin/auth/login` → JWT con claim `rol: admin`. Middleware `get_current_admin` que valida `rol == 'admin'` (independiente del middleware de especialistas). → `backend/app/api/admin_auth.py`
- [ ] Endpoints de especialistas (admin): `GET /api/admin/especialistas`, `POST /api/admin/especialistas`, `PUT /api/admin/especialistas/{id}`, `PATCH /api/admin/especialistas/{id}/suscripcion` (cambio de plan + log automático). → `backend/app/api/admin_especialistas.py`
- [ ] Endpoints de planes: `GET /api/admin/planes`, `POST /api/admin/planes`, `PUT /api/admin/planes/{id}`. → `backend/app/api/admin_planes.py`
- [ ] Endpoint de dashboard admin: `GET /api/admin/dashboard` → estadísticas globales: total especialistas activos, suscripciones por plan, suscripciones por vencer en 30 días, especialistas nuevos este mes. → `backend/app/api/admin_dashboard.py`

#### 7.3 Frontend: Panel /admin
- [ ] Ruta `/admin` separada del grupo `(dashboard)`. Crear grupo `(admin)` con su propio `layout.tsx` (sidebar distinto, paleta violeta/índigo para diferenciarlo del verde/azul del especialista).
- [ ] Página de login admin: `/admin/login` (completamente independiente del login del especialista).
- [ ] Dashboard admin (`/admin/dashboard`): KPIs globales → Total especialistas, Activos, Ingresos estimados del mes, Suscripciones por vencer.
- [ ] Listado de especialistas (`/admin/especialistas`): tabla con nombre, email, plan, estado, fecha vencimiento, acciones.
- [ ] Formulario de registro/edición de especialista: nombre, apellido, email, password inicial, especialidad, plan, fecha vencimiento.
- [ ] Gestión de planes (`/admin/planes`): CRUD de planes de suscripción.
- [ ] Log de actividad admin: auditoría de cambios de plan (solo lectura).

#### 7.4 Seguridad y separación de roles
- [ ] El JWT del especialista y el JWT del admin son **completamente separados** (diferentes claims; validados estrictamente).
- [ ] Las rutas `/api/admin/*` retornan 403 si el token no tiene `rol: admin`.
- [ ] Las rutas `/api/*` (especialista) retornan 403 si el token tiene `rol: admin` (evitar uso cruzado).
- [ ] La sesión de admin expira en 4 horas. No hay "recordar sesión" para admin.

#### 7.5 Middleware de suscripción activa
- [ ] Middleware en FastAPI que, al validar el JWT del especialista, verifica `suscripcion_activa == true` y `fecha_vencimiento >= hoy`. Si está vencida, retorna `HTTP 402 Payment Required`.
- [ ] Frontend: interceptor global que captura el `402` y muestra un modal de "Suscripción vencida — contacta al administrador" bloqueando el uso del sistema.

#### Criterios de aceptación Fase 7
- El administrador puede hacer login en `/admin/login` con credenciales propias.
- Puede registrar un nuevo especialista, asignarle un plan y activar/desactivar su acceso.
- El dashboard admin muestra estadísticas globales reales.
- Un especialista con suscripción vencida recibe `402` y ve el modal de bloqueo en el frontend.
- Los JWTs de admin y especialista no son intercambiables.

---

### Fase 8: Despliegue

**Objetivo:** Configuración final para Easy Panel en el VPS. Se ejecuta únicamente cuando las Fases 6 y 7 estén aprobadas y estables.

#### 8.1 Docker Compose para producción
- [ ] `docker-compose.yml` listo para Easy Panel (postgres, backend, frontend, redis si aplica). Volúmenes para datos; variables desde entorno.
- [ ] IP VPS 147.93.184.194 documentada para cuando se configure dominio o acceso.

#### 8.2 Variables y secretos
- [ ] Todas las variables documentadas (README o PLAN). Usuario configura en Easy Panel; no subir `.env` con secretos. `.env.example` con `YCLOUD_API_KEY=`, `ADMIN_JWT_SECRET=`, `ESPECIALISTA_JWT_SECRET=` y resto.

#### 8.3 Base de datos y SSL
- [ ] Migraciones aplicadas al desplegar (scripts 001 a 007). Estrategia de backups (pg_dump, retención). SSL vía proxy reverso (Easy Panel / Nginx / Traefik).

#### Criterios de aceptación Fase 8
- `docker-compose up` levanta todos los servicios. App accesible con todas las funcionalidades de las fases anteriores. RLS y JWT operativos en producción.

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
- Fases pendientes en orden lógico:
  1. **Fase 6** — Historia Clínica Modular por Especialidad
  2. **Fase 7** — Panel de Administración SaaS
  3. **Fase 8** — Despliegue en VPS (siempre al final)
- Ante dudas o detalles faltantes, pedir: *"Actualiza el PLAN.md para incluir X"*.
- Para continuar: *"Empecemos con la Fase 6: Historia Clínica Modular"* o la fase que corresponda.

---

*Documento: Odonto-Focus | Master Plan. Última actualización: 11/03/2026.*
*Estado: Fases 1–5 completadas ✅ | Pendiente: Fase 6 (HC Modular), Fase 7 (Admin SaaS), Fase 8 (Despliegue).*
