# PLAN.md — VitalNexus | SaaS Médico Multi-Tenant

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
- [x] Scrollbar visible en la barra de tabs del historial clínico (eliminado con CSS utility).

**Problemas resueltos y nuevas funcionalidades:**
- [x] **Visibilidad en Línea de Tiempo:** Se modificó el backend (`list_historias_by_paciente`) y el frontend (`page.tsx`) para mostrar los nombres de los archivos adjuntos directamente en la tarjeta de la historia clínica.
- [x] **Autenticación en Descargas:** Se actualizó `dependencies.py` para permitir la validación de JWT a través de un parámetro de consulta (`?token=...`), permitiendo que los enlaces directos del navegador funcionen correctamente sin encabezados manuales.
- [x] **Visualización Inline vs Descarga:** 
  - Backend: El endpoint de descarga ahora soporta `download=true` para forzar la descarga o `"inline"` por defecto.
  - Frontend: Se agregaron botones separados para "Ver" (pestaña nueva) y "Descargar" (guardar archivo) usando iconos de `lucide-react`.

---

### Fase 6: Historia Clínica Modular por Especialidad

**Objetivo:** Hacer que el sistema sea utilizable por múltiples especialidades médicas además de la odontología, sin reescribir la lógica existente. Las secciones de la historia clínica se configuran dinámicamente según la especialidad del especialista logueado.

> **Contexto:** Hoy el sistema es solo para odontólogos (maxilofaciales, ortodoncistas, etc.). Un cardiólogo no necesita odontograma, pero sí electrocardiograma. Un traumálogo necesita radiografías. Los datos básicos (consulta, antecedentes, examen físico, plan) pueden coincidir en nombre pero su contenido varía por especialidad.

#### 6.1 Modelo de datos: Catálogo de secciones
- [x] Añadir tabla **`hc_secciones`** en `sys_config`: `id` (UUID), `codigo` (único, ej. `ODONTOGRAMA`, `ECG`, `RADIOGRAFIA`, `EXAMEN_FISICO`), `nombre`, `descripcion`, `componente_frontend` (nombre del componente Next.js a renderizar), `activo`. Sin RLS (catálogo global compartido). → `scripts/006_hc_modular.sql`
- [x] Tabla **`especialidad_hc_secciones`** (N:N): `especialidad_id` (FK `sys_config.especialidades`), `hc_seccion_id` (FK `hc_secciones`), `orden` (para definir el orden en el modal), `obligatoria` (bool). Sin RLS. → `scripts/006_hc_modular.sql`
- [x] **Poblar con especialidad odontología** (primer seed): secciones `CONSULTA` (orden 1), `ANTECEDENTES` (2), `EXAMEN_FISICO` (3), `ODONTOGRAMA` (4), `PLAN` (5). La sección `ODONTOGRAMA` queda marcada como exclusiva de odontología.
- [x] Añadir columna `especialidad_id` a **`sys_clinical.historias_clinicas`** para identificar a qué especialidad pertenece cada historia. Migrar registros existentes con la especialidad de odontología.

#### 6.2 Backend: endpoints de configuración modular
- [x] `GET /api/especialidades/{id}/hc-secciones` → retorna las secciones ordenadas para una especialidad (usado por el frontend para construir el modal dinámicamente).
- [x] `GET /api/hc-secciones` → listado completo del catálogo (para administración).
- [x] Endpoints CRUD para el catálogo de secciones y para la asignación especialidad ↔ secciones. → `backend/app/api/hc_secciones.py`
- [x] Al crear o editar una historia clínica, el endpoint valida que el `especialista_id` sea de una especialidad que incluya las secciones enviadas.

#### 6.3 Frontend: modal dinámico de Historia Clínica
- [x] El modal de Historia Clínica (`historias/page.tsx`) deja de tener los pasos hardcodeados. Al abrirse, llama a `GET /api/especialidades/{id}/hc-secciones` y construye los tabs y el contenido dinámicamente.
- [x] Cada sección tiene un `componente_frontend` (string), el modal hace un map de string → componente React:
  ```
  CONSULTA        → <ConsultaStep />
  ANTECEDENTES    → <AntecedentesStep />
  EXAMEN_FISICO   → <ExamenFisicoStep />
  ODONTOGRAMA     → <OdontogramaStep /> (iframe a /embed/odontograma)
  PLAN            → <PlanStep />
  ECG             → <ElectrocardiogramaStep /> (futuro)
  RADIOGRAFIA     → <RadiografiasStep /> (futuro)
  ```
- [x] El especialista logueado siempre ve solo las secciones de su especialidad. Nunca ve secciones irrelevantes.
- [x] Los datos de cada sección se almacenan en `historias_clinicas` (campos genéricos JSON o columnas por sección según se defina en 6.1).

#### 6.4 Datos específicos por especialidad (Refinamiento modular)
- [x] Para especialidades no odontológicas: habilitar configuración dinámica de los campos en "Examen Físico" y "Plan de Tratamiento".
- [x] Ocultar odontograma y campos específicos de boca para médicos internistas y otras especialidades.
- [x] Las secciones de Consulta Inicial y Antecedentes se mantienen estables como base común.
- [x] Para cardiología: sección `ECG` con campos específicos (ritmo, frecuencia, observaciones). Componente `<ElectrocardiogramaStep />`.
- [x] Para traumatología: sección `RADIOGRAFIA` con carga de imágenes y observaciones. Componente `<RadiografiasStep />`.
- [x] Las especialidades se registran en `sys_config.especialidades` (ya existe); solo se añaden las secciones correspondientes.

#### Criterios de aceptación Fase 6
- El modal de Historia Clínica construye sus pasos desde la BD, no desde código hardcodeado.
- Un especialista de odontología ve: Consulta, Antecedentes, Examen Físico, Odontograma, Plan.
- Un futuro especialista de cardiología vería: Consulta, Antecedentes, Examen Físico, ECG, Plan (sin Odontograma).
- La especialidad queda registrada en cada historia clínica.
**✅ Criterios cumplidos.**

---

### Fase 7: Panel de Administración SaaS

**Objetivo:** Crear un panel separado (ruta `/admin`) donde el dueño del sistema pueda registrar especialistas, gestionar suscripciones y monitorear la plataforma. Este panel es completamente independiente del dashboard del especialista.

> **Contexto:** El dueño del sistema vende suscripciones a especialistas. Él los registra, les configura el acceso y controla el plan contratado. Los especialistas ya existen en `sys_config.especialistas`; solo se necesita enriquecer esa tabla y crear las de administración.

#### 7.1 Arquitectura de esquemas de BD

**Decisión de arquitectura:** Los datos de administración van en el mismo esquema `sys_config` (no se crea un esquema `sys_admin` separado). Justificación: son tablas de configuración del sistema, el esquema `sys_config` ya existe y aplica. Se mantiene la convención: `sys_config` = configuración global, `sys_clinical` = datos clínicos de pacientes.

- [x] Añadir campos a **`sys_config.especialistas`**: `plan_suscripcion` (VARCHAR: `'basico'`, `'profesional'`, `'enterprise'`), `suscripcion_activa` (bool, default true), `fecha_vencimiento_suscripcion` (DATE), `notas_admin` (TEXT). → `scripts/007_admin_suscripciones.sql`
- [x] Tabla **`sys_config.planes_suscripcion`**: `id`, `codigo` (único: `basico`, `profesional`, `enterprise`), `nombre`, `precio_mensual`, `max_pacientes`, `max_citas_mes`, `incluye_whatsapp` (bool), `incluye_multiusuario` (bool), `activo`. → `scripts/007_admin_suscripciones.sql`
- [x] Tabla **`sys_config.log_suscripciones`**: `id`, `especialista_id`, `cambio` (JSON: `{de: 'basico', a: 'profesional'}`), `motivo`, `admin_id`, `created_at`. Para auditoría de cambios de plan. → `scripts/007_admin_suscripciones.sql`
- [x] Tabla **`sys_config.administradores`**: `id` (UUID), `email` (único), `password_hash`, `nombre`, `apellido`, `activo`, `created_at`. **Sin RLS** (acceso global). JWT separado con `rol = 'admin'`. → `scripts/007_admin_suscripciones.sql`

#### 7.2 Backend: API de administración
- [x] Autenticación admin: `POST /api/admin/auth/login` → JWT con claim `rol: admin`. Middleware `get_current_admin` que valida `rol == 'admin'` (independiente del middleware de especialistas). → `backend/app/api/admin_auth.py`
- [x] Endpoints de especialistas (admin): `GET /api/admin/especialistas`, `POST /api/admin/especialistas`, `PUT /api/admin/especialistas/{id}`, `PATCH /api/admin/especialistas/{id}/suscripcion` (cambio de plan + log automático). → `backend/app/api/admin_especialistas.py`
- [x] Endpoints de planes: `GET /api/admin/planes`, `POST /api/admin/planes`, `PUT /api/admin/planes/{id}`. → `backend/app/api/admin_planes.py`
- [x] Endpoint de dashboard admin: `GET /api/admin/dashboard` → estadísticas globales: total especialistas activos, suscripciones por plan, suscripciones por vencer en 30 días, especialistas nuevos este mes. → `backend/app/api/admin_dashboard.py`

#### 7.3 Frontend: Panel /admin
- [x] Ruta `/admin` separada del grupo `(dashboard)`. Crear grupo `(admin)` con su propio `layout.tsx` (sidebar distinto, paleta violeta/índigo para diferenciarlo del verde/azul del especialista).
- [x] Página de login admin: `/admin/login` (completamente independiente del login del especialista).
- [x] Dashboard admin (`/admin/dashboard`): KPIs globales → Total especialistas, Activos, Ingresos estimados del mes, Suscripciones por vencer.
- [x] Listado de especialistas (`/admin/especialistas`): tabla con nombre, email, plan, estado, fecha vencimiento, acciones.
- [x] Formulario de registro/edición de especialista: nombre, apellido, email, password inicial, especialidad, plan, fecha vencimiento.
- [x] Gestión de planes (`/admin/planes`): CRUD de planes de suscripción.
- [x] Log de actividad admin: auditoría de cambios de plan (solo lectura).

#### 7.4 Seguridad y separación de roles
- [x] El JWT del especialista y el JWT del admin son **completamente separados** (diferentes claims; validados estrictamente).
- [x] Las rutas `/api/admin/*` retornan 403 si el token no tiene `rol: admin`.
- [x] Las rutas `/api/*` (especialista) retornan 403 si el token tiene `rol: admin` (evitar uso cruzado).
- [x] La sesión de admin expira en 4 horas. No hay "recordar sesión" para admin.

#### 7.5 Middleware de suscripción activa
- [x] Middleware en FastAPI que, al validar el JWT del especialista, verifica `suscripcion_activa == true` y `fecha_vencimiento >= hoy`. Si está vencida, retorna `HTTP 402 Payment Required`.
- [x] Frontend: interceptor global que captura el `402` y muestra un modal de "Suscripción vencida — contacta al administrador" bloqueando el uso del sistema.

#### 7.6 Mejoras de Seguridad y Gestión de Planes
- [x] Cambio de contraseña de Administrador: Endpoint POST `/api/admin/auth/change-password` verificando que coincida la contraseña actual ingresada en texto plano y encriptandola nuevamente usando bcrypt.
- [x] Interfaz de Seguridad (`/admin/seguridad`): Formulario moderno con indicador visual animado de fortaleza de la nueva contraseña (Débil, Media, Fuerte), con políticas de validación estrictas obligatorias (mínimo 8 caracteres, mayúsculas, minúsculas, números y al menos un símbolo especial).
- [x] Gestión de Características de Planes: Adaptación del backend (endpoint PUT) y componente UX/UI (Modal Animado) para crear y editar dinámicamente el precio, límites y características de los planes suscripción.
- [x] Extensibilidad de características en los planes: Nueva columna en BD (`soporte_prioritario` boolean DEFAULT FALSE) para ofrecer nuevos beneficios. El cambio de BD quedó respaldado documentadamente en `scripts/011_add_col_prioritario.sql`.
- [x] **Autogestión de Seguridad (Especialista):** Nueva interfaz en el panel del especialista que permite a cada doctor activar su propia rotación de claves y elegir el intervalo de días, dándoles control total sobre la seguridad de su cuenta independientemente de los ajustes globales.
- [x] **Rediseño Premium de Seguridad (UX/UI):** Re-organización de la página de seguridad situando las recomendaciones junto al formulario de clave, moviendo la configuración de rotación a un panel inferior destacado para mayor claridad, y aplicando una paleta de alto contraste para mejorar la legibilidad.

#### Criterios de aceptación Fase 7
- El administrador puede hacer login en `/admin/login` con credenciales propias.
- Puede registrar un nuevo especialista, asignarle un plan y activar/desactivar su acceso.
- El dashboard admin muestra estadísticas globales reales.
- Un especialista con suscripción vencida recibe `403` (o `402`) y el sistema bloquea su acceso.
- Los JWTs de admin y especialista no son intercambiables.
- El administrador cuenta con la capacidad de gestionar y asegurar su cuenta mediante actualizaciones validadas de su contraseña y monitoreo de las reglas modernas de claves seguras.
**✅ Criterios cumplidos.**

---

### Fase 8: Configuración Global y Catálogos Maestros (Panel Admin)

**Objetivo:** Centralizar la gestión del núcleo de la plataforma para permitir su expansión y escalabilidad a nuevas ramas médicas sin tocar directamente la base de datos, manejando los ajustes globales desde una única interfaz gráfica maestra en el Panel Administrativo.

#### 8.1 Gestión de Especialidades Médicas (Expansión Multi-Especialidad)
- [x] **Especialidades:** Interfaz administrativa (CRUD) para que el Máster Admin cree nuevas especialidades (ej. Cardiología, Pediatría, Traumatología).
- [x] **Mapeo de Módulos Clínicos:** Al crear o editar una especialidad, el Admin podrá "encender" o "apagar" módulos específicos de historia clínica (`hc_secciones`) para esa rama (Ej. Odontograma apagado para Cardiólogos, pero sección de ECG prendido).

### FASE 8: Configuración Global y Catálogos Maestros ✅
**Estado: Completado**
- [x] 8.1 Gestión de Especialidades Médicas (CRUD Admin).
- [x] 8.2 Definición Dinámica de Módulos (Mapeo Especialidad <-> Secciones HC).
- [x] 8.3 Ajustes Financieros y Conexiones Externas (BCV completado, YCloud Infra preparada).
- [x] 8.3.1 Motor Financiero Multi-moneda: Calcular precios en Bs basándose automáticamente en la tasa del BCV, tomando el **Euro** como referencia principal (ej: consulta 25$ -> cobro en Bs a tasa Euro BCV). Mostrar también comparativa con tasa Dólar BCV. Implementado en presupuestos (creación y abonos), con conversión EUR prominente y USD informativa.
- [ ] 8.3.2 WhatsApp: Aprobación de plantillas en Meta/YCloud (recordatorio_cita, abono_confirmacion).
- [ ] 8.3.3 WhatsApp: Verificación de número oficial en producción.
- [x] 8.4 Gestión de Empleados y Permisos Admin (Roles Master/Solo Lectura).

#### Criterios de aceptación Fase 8
- El menú de "Configuración" estará 100% operativo en el panel administrativo.
- Se podrá crear una nueva Especialidad Médica sin recurrir y conectarse a scripts SQL directos en el servidor.
- Todo catálogo general añadido impactará inmediatamente a todos los arrendatarios (tenants) del ecosistema en su siguiente sesión.

---

### Fase 9: Refinamiento de Negocio, Rentabilidad y Portal Público

**Objetivo:** Completar la visión original del negocio enfocada en la rentabilidad del especialista y la facilidad de uso para el paciente.

#### 9.1 Módulo de Rentabilidad (Costo vs. Ganancia)
- [x] Implementar vista en el Dashboard del Especialista que calcule: `Precio del Servicio - Costo Sumado de Insumos = Ganancia Neta`.
- [x] Permitir definir "Merma" o costos indirectos por servicio.
- [x] Reporte mensual de "Servicios más rentables" (Análisis de Rentabilidad Detallada).

#### 9.2 Portal Público de Reserva (Booking)
- [x] Crear una ruta pública `/p/[slug-especialista]` para que pacientes vean servicios y agenden.
- [x] **Configuración de Visibilidad**: Opción para quitar/ocultar los precios de los servicios en el perfil público.
- [x] Integrar con el calendario de citas disponible.
- [x] Formulario de registro rápido para nuevos pacientes captados desde el portal.

#### 9.3 Automatización de Recibos y Notificaciones de Abono
- [x] Al registrar un abono, disparar automáticamente un mensaje de WhatsApp/Email.
- [x] El mensaje incluye el "Saldo Pendiente" actualizado.
- [x] Generar Recibo Digital Premium (web) accesible desde un link en el mensaje.

#### 9.4 Premium UX/UI Enhancement (Sesión 15/03/2026)
- [x] **Alertas Médicas (Sincronización Inteligente):** Banners visuales de alto impacto en la HC. Implementada sincronización bidireccional entre alertas globales y antecedentes de la historia clínica, con mapeo automático de botones (Alergias, Asma, Diabetes, etc.) y pre-llenado inteligente.
- [x] **Clonación de Evoluciones:** Botón "Copiar Última" para pre-llenar nuevas evoluciones, mejorando la eficiencia del especialista.
- [x] **Command Search (Ctrl+K):** Paleta de comandos global para navegación ultra-rápida y búsqueda instantánea de pacientes.
- [x] **Dashboard MoM Trends:** Indicadores porcentuales de crecimiento mensual y alertas de stock en tiempo real.
- [x] **Presupuesto Público Sharing:** Vista digital profesional para presupuestos, con capacidad para compartir vía WhatsApp y exportar a PDF.

#### Criterios de aceptación Fase 9
- El especialista puede ver cuánto dinero neto le queda tras descontar materiales.
- Un paciente puede agendarse solo desde una URL pública.
- El paciente recibe un "comprobante digital" automático vía WhatsApp al pagar con acceso a un recibo premium.
- **Recordatorios Automáticos**: Al registrar una cita, se envía recordatorio por WhatsApp/Email (si existe el dato) con antelación configurable.
**✅ Criterios cumplidos.**

---

### Fase 10: Despliegue

**Objetivo:** Configuración final para Easy Panel en el VPS. Se ejecuta únicamente cuando todas las fases anteriores estén aprobadas y estables.

#### 10.1 Docker Compose para producción
- [ ] `docker-compose.yml` listo para Easy Panel (postgres, backend, frontend, redis si aplica). Volúmenes para datos; variables desde entorno.
- [ ] IP VPS 147.93.184.194 documentada para cuando se configure dominio o acceso.

#### 10.2 Variables y secretos
- [ ] Todas las variables documentadas. `.env.example` actualizado.

#### 10.3 Base de datos y SSL
- [ ] Migraciones aplicadas al desplegar (scripts 001 a 009). SSL vía proxy reverso.

#### Criterios de aceptación Fase 10
- `docker-compose up` levanta todos los servicios. App accesible en producción.

---

### Fase 11: Mi Perfil y Configuración de Clínica
**Objetivo:** Permitir al especialista personalizar su identidad digital, datos de contacto y presencia en redes sociales para el portal público y recibos digitales.

#### 11.1 Gestión de Identidad y Clínica
- [x] **Configuración de Botón:** Vincular el icono de engranaje (Settings) del dashboard a la nueva ruta `/configuracion`. → `layout.tsx` línea 124-130.
- [x] **Perfil del Especialista:** Permitir la carga de foto de perfil (avatar), biografía corta y actualización de datos profesionales. → Tab "Mi Perfil" en `/configuracion`.
- [x] **Redes Sociales:** Campos para Instagram, Facebook, TikTok y link directo de WhatsApp. → Tab "Redes Sociales" en `/configuracion`.
- [x] **Datos de la Clínica:** Nombre comercial, dirección física, teléfonos de contacto y carga de **Logo de la Clínica** para que aparezca en los recibos y el portal. → Tab "Identidad Clínica" con componente `LogoUpload.tsx`.

#### 11.2 Impacto Visual
- [x] Mostrar la foto, nombre de clínica, dirección y redes sociales (Instagram, Facebook, TikTok, WhatsApp) en el **Portal Público de Reserva** (`/p/[slug]`). Iconos interactivos con hover animado.
- [x] Utilizar el logo y datos de contacto (email, dirección) en la generación del **Recibo Digital** (`/recibo/[id]`) y en los **PDFs de presupuesto** (`/presupuesto/[id]`). Reemplazado "OdontoFocus" hardcodeado por datos dinámicos de la clínica.

#### Criterios de aceptación Fase 11
- El botón de configuración abre una interfaz funcional.
- El especialista puede cambiar su foto y links de redes.
- Los cambios se reflejan automáticamente en el portal público que ven los pacientes.
**✅ Criterios cumplidos.**

---

## 5. Estructura de Carpetas del Monorepo

```
PlataformaMedicaSaaS/   (VitalNexus)
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
  1. **Fase 10** — Despliegue en VPS (Easy Panel)
- Pendientes menores (no bloqueantes):
  - Fase 9.1: Merma/costos indirectos y reporte mensual de rentabilidad.
  - Fase 9.2: Toggle de visibilidad de precios en portal público.
  - Fase 8.3.2/8.3.3: Aprobación plantillas WhatsApp y verificación número en producción.
- Ante dudas o detalles faltantes, pedir: *"Actualiza el PLAN.md para incluir X"*.

---

---

### Nota de Implementación WhatsApp (YCloud) - 20/03/2026

Se ha preparado la infraestructura para el envío de notificaciones vía WhatsApp, pero queda en **pausa** por decisión del usuario.

**Lo que se completó:**

1. **DB:** Agregado campo `ycloud_whatsapp_number` a `sys_config.configuracion_global` (Script `020_add_ycloud_number_col.py`).
2. **Modelos:** Sincronizados modelos de SQLModel y schemas de Pydantic en el Backend.
3. **UI:** Campos de configuración para API Key y Número de WhatsApp añadidos al Panel de Administración Global.
4. **Servicios:** Modificado `YCloudService` y el worker de mensajes para priorizar la configuración de la BD sobre el `.env`.

**Pendientes para el futuro:**

- [ ] Configurar las API Keys reales en el Panel Admin.
- [ ] Crear y aprobar plantillas en Meta (`recordatorio_cita`, `abono_confirmacion`).
- [ ] Realizar pruebas de envío en producción con número verificado.

---

### Fase 12: Marketing Landing Page (Atracción de Especialistas)

**Objetivo:** Transformar la página de inicio en un portal de ventas de alto impacto visual (Basado en el análisis de UroVital), diseñado para convencer a los especialistas de unirse a la plataforma.

#### 12.1 Estética y "Feel" Premium
- [x] **Hero Tecnológico**: Fondo `deep-dark` con gradientes cian/azul y un mockup flotante funcional del dashboard de VitalNexus.
- [x] **Contadores de Éxito**: Contadores animados (+2,400 Especialistas, +150k Pacientes, 99.9% Uptime Cloud).
- [x] **Micro-interacciones**: Efectos de "glow" y resplandor al pasar el cursor por botones y tarjetas.

#### 12.2 Estructura de Conversión
- [x] **Sección Beneficios Doctor**: Grilla de 6 tarjetas: HC Inteligente, Análisis Financiero, RLS, Odontograma Evolutivo, Gestión de Citas, Portal de Especialista.
- [x] **Timeline de Onboarding**: Paso a paso (01-04): Registrate, Configura tu Consultorio, Importa Pacientes, Analiza tu Ganancia.
- [x] **Separación de Login**: Login accesible al final; prioridad al mensaje de marketing para nuevos usuarios.

#### Criterios de aceptación Fase 12
- La página `page.tsx` proyecta una imagen de solidez tecnológica y profesionalismo.
- Los especialistas encuentran una propuesta de valor clara antes de iniciar sesión.
**✅ Criterios cumplidos.**


---

*Documento: VitalNexus | Master Plan. Última actualización: 03/04/2026.*
*Estado: Fases 1–12 COMPLETADAS ✅ | Único pendiente mayor: Fase 10 (Despliegue VPS). Pendientes menores: WhatsApp plantillas (8.3.2/8.3.3), Merma/costos indirectos (9.1), Toggle precios portal (9.2).*


