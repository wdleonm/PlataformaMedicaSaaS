# Resumen Técnico y Funcional — VitalNexus 🏥

Este documento presenta una especificación unificada y detallada de la arquitectura, funcionalidades, stack tecnológico y características de diseño de **VitalNexus**, una plataforma SaaS médica multi-tenant diseñada para especialistas de salud en Venezuela y Latinoamérica.

El propósito de este resumen es servir como la **fuente de verdad técnica y funcional** para ser interpretada por agentes de Inteligencia Artificial (Gemini, Cursor, Kiro y otros IDEs) bajo la **Metodología AI-DLC**.

---

## 1. Ficha del Proyecto y Estado de Despliegue

*   **Nombre de la Plataforma:** VitalNexus
*   **Modelo de Negocio:** SaaS Multi-Tenant (Planes Básico, Profesional y Enterprise, con 30 días de prueba gratuita).
*   **URL de Producción:** [https://analytics-vitalnexus-frontend.rojo7o.easypanel.host](https://analytics-vitalnexus-frontend.rojo7o.easypanel.host)
*   **URL de Panel de Control Administrativo:** `/admin/login`
*   **IP del Servidor VPS:** `147.93.184.194` (Easy Panel)
*   **Estado del Roadmap:** Fases 1 a 12 completadas y validadas con éxito. Código y base de datos optimizados para producción.

---

## 2. Arquitectura de Software y Seguridad (Core)

El diseño arquitectónico de VitalNexus prioriza la seguridad, el aislamiento absoluto de los datos clínicos y la escalabilidad multi-especialidad.

### A. Aislamiento Multi-Tenant mediante RLS (Row Level Security)
A diferencia del enfoque tradicional de crear una base de datos por cliente (que encarece la infraestructura), VitalNexus implementa un **esquema compartido** donde el aislamiento está garantizado a nivel del motor de base de datos PostgreSQL:
1.  Todas las tablas operativas (pacientes, citas, odontogramas, presupuestos, insumos, etc.) incluyen la columna `especialista_id` (UUID v4) como clave externa.
2.  En el backend, un middleware/dependency de FastAPI captura el token JWT del especialista autenticado.
3.  En cada transacción a la base de datos, se ejecuta la instrucción SQL:
    ```sql
    SET LOCAL app.especialista_id = 'uuid-del-especialista';
    ```
4.  La base de datos tiene activada la política de **Row Level Security (RLS)** en estas tablas, evaluando la cláusula:
    ```sql
    USING (especialista_id = current_setting('app.especialista_id')::uuid)
    ```
    Esto impide de forma matemática que un especialista pueda leer, insertar, editar o borrar registros correspondientes a otro especialista, incluso ante errores de código en la capa de aplicación.

### B. Llaves Primarias Basadas en UUID v4
Todas las tablas del sistema utilizan **UUID v4** en lugar de IDs auto-incrementales. Esto incrementa la seguridad (evitando ataques de enumeración) y facilita la sincronización/migración de datos distribuidos en el futuro.

### C. Separación Estricta de Roles y Autenticación
*   **JWT Especialistas:** Emplea claims específicos orientados al flujo clínico. El middleware comprueba que la suscripción esté activa (`suscripcion_activa == true` y `fecha_vencimiento >= hoy`). Si expira, se retorna un código `HTTP 402 Payment Required`, disparando un bloqueo visual completo en la interfaz del especialista.
*   **JWT Administradores:** Emplea el claim `rol: 'admin'`. Su ciclo de vida es independiente, con expiración en 4 horas y validación estricta de acceso a los endpoints `/api/admin/*`.

---

## 3. Stack Tecnológico

La plataforma está diseñada bajo un enfoque de monorepo desacoplado, facilitando el desarrollo y la portabilidad mediante contenedores:

*   **Backend (FastAPI):**
    *   Python 3.10+
    *   **SQLModel:** Híbrido que unifica el modelado Pydantic (validación) y SQLAlchemy (ORM).
    *   **Alembic:** Sistema de control de migraciones.
    *   **APScheduler:** Orquestador de tareas en segundo plano (para la cola de notificaciones de WhatsApp).
    *   Puerto local de ejecución: `8001`
*   **Frontend (Next.js 14):**
    *   React 18 con Next.js (App Router).
    *   TypeScript (Tipado estricto).
    *   **Tailwind CSS:** Framework de estilos.
    *   **Framer Motion:** Biblioteca para micro-interacciones y animaciones avanzadas.
    *   **Lucide Icons:** Set de iconos vectoriales interactivos.
    *   Puerto local de ejecución: `3000`
*   **Infraestructura y Base de Datos:**
    *   **PostgreSQL:** Base de datos principal.
    *   **Redis:** Empleado como caché y cola de mensajería asíncrona.
    *   **Docker & Docker Compose:** Contenedores aislados para base de datos, backend, frontend y Redis, lo que agiliza la implementación en Easy Panel.

---

## 4. Detalle Técnico y Funcional de Módulos

### Módulo 1: Dashboard Principal (Centro de Comando)
Ofrece al especialista un resumen en tiempo real del estado de su práctica médica al iniciar sesión:
*   **KPIs Dinámicos:** Pacientes del mes (con tasa MoM - Month over Month), citas programadas, alertas de stock crítico de insumos y la **Utilidad Neta Real** calculada en tiempo real.
*   **Agenda Diaria:** Listado interactivo de citas ordenadas cronológicamente con sus respectivos estados.
*   **Accesos Rápidos:** Panel intuitivo para acciones rápidas (crear paciente, nueva cita, registrar cobro, etc.).

### Módulo 2: Historias Clínicas Modulares por Especialidad
El sistema ha evolucionado de un modelo rígido a uno completamente dinámico basado en catálogos:
*   **BD (`hc_secciones`):** Catálogo que almacena la configuración de los pasos de la historia clínica (código de paso, nombre, orden, componente frontend asignado).
*   **BD (`especialidad_hc_secciones`):** Tabla relacional que determina qué secciones se activan para cada especialidad (ej. Odontología, Medicina Interna, Cardiología, Traumatología).
*   **Carga Dinámica:** Al abrir el expediente del paciente, el frontend ejecuta `GET /api/especialidades/{id}/hc-secciones`. La UI mapea de forma dinámica los componentes en React (`CONSULTA` -> `<ConsultaStep />`, `ODONTOGRAMA` -> `<OdontogramaStep />`, etc.).
*   **Clonación de Evoluciones:** Botón "Copiar Última" que pre-llena una nueva consulta con el historial previo para optimizar la velocidad de atención.
*   **Soporte de Adjuntos:** Visualización inline o descarga directa de radiografías, exámenes y archivos adjuntos mediante tokens autorizados en los parámetros de la URL.

### Módulo 3: Odontograma Evolutivo 360° (Exclusivo de Odontología)
*   **Nomenclatura FDI:** Soporta dentición permanente (adultos, 32 piezas dentales) y dentición temporal (niños, 20 piezas).
*   **Inmutabilidad Histórica:** La tabla `odontograma_registros` funciona bajo un esquema estricto de **solo lectura e inserción (INSERT-only)**. Al cambiar el estado de una pieza (caries, corona, restauración, extracción) en una cara específica (vestibular, lingual, mesial, distal, oclusal, radicular), se crea un nuevo registro con fecha y hora. Esto permite reconstruir el mapa dental del paciente en cualquier momento del tiempo especificando una fecha límite.
*   **Arquitectura de Iframe Dedicado:** Para prevenir solapamientos de CSS y problemas de visualización, el odontograma se renderiza dentro de un iframe que carga la ruta `/embed/odontograma`. Cuenta con una barra de herramientas de hallazgos horizontal sobre las piezas y soporte para pantalla completa.

### Módulo 4: Motor Financiero Multi-Moneda y Rentabilidad Real
*   **Rentabilidad por Insumos:** Cada servicio tiene configurada una "receta" en `servicio_insumos` con la cantidad exacta de materiales que consume. Al facturar un servicio, el sistema calcula:
    $$\text{Utilidad Neta} = \text{Monto Cobrado} - \sum \text{Costo Insumos (con factor de merma)}$$
*   **Conversión Cambiaria Automática:** Los servicios se configuran en dólares (USD). La base de datos sincroniza diariamente la tasa oficial de conversión del **Banco Central de Venezuela (BCV)**. Utiliza el **Euro (EUR)** como moneda de referencia para cobros y facturación física en Bolívares (Bs.), mostrando de manera informativa la equivalencia en Dólares (USD) para transparencia cambiaria.
*   **Triggers Financieros:** Al registrarse un pago (abono) en la tabla `abonos`, un disparador SQL (`abonos_recalcular_saldo`) calcula automáticamente el saldo restante y actualiza en tiempo real el estado del presupuesto (`pendiente`, `parcialmente_pagado`, `pagado`).
*   **Presupuesto Compartido:** Permite exportar los presupuestos a PDF estructurados o generar enlaces públicos interactivos de visualización para que los especialistas los compartan con sus pacientes vía WhatsApp.

### Módulo 5: Comunicaciones Inteligentes por WhatsApp (YCloud)
*   **API Oficial de WhatsApp:** Integración con YCloud para envíos masivos y automatizados utilizando plantillas pre-aprobadas por Meta (`recordatorio_cita`, `abono_confirmacion`), reduciendo a cero el riesgo de bloqueo de números telefónicos.
*   **Cola con Resiliencia:** La tabla `cola_mensajes` almacena los mensajes pendientes. Un worker programado en FastAPI procesa la cola y gestiona reintentos mediante un algoritmo de **backoff exponencial** (`2^reintentos` minutos) en caso de fallas de conexión o API.

### Módulo 6: Portal Público de Reserva (Booking)
Cada especialista cuenta con su propio minisite optimizado para buscadores (SEO):
*   Ruta: `/p/[slug-especialista]`
*   Muestra información profesional, horarios dinámicos por día de la semana, dirección de la clínica con mapa, redes sociales y catálogo de servicios ofrecidos.
*   **Control de Privacidad:** Opción para ocultar o mostrar los precios en el portal público según la conveniencia del doctor.
*   Permite a los pacientes agendar sus citas de manera autónoma, registrándolos automáticamente en la base de datos del especialista correspondiente.

### Módulo 7: Panel de Administración SaaS (Master Admin)
Panel independiente situado en `/admin` pintado con una paleta de colores violeta/índigo:
*   Muestra analíticas de ingresos globales del SaaS y tasa de abandono.
*   CRUD de Especialistas, asignación manual de suscripciones, control de planes y bloqueo preventivo.
*   CRUD de Especialidades Médicas y mapeo modular de secciones de historias clínicas.
*   Ajustes de variables de entorno del sistema (keys de YCloud, tasas cambiarias manuales, etc.).
*   Gestión de permisos de personal administrativo (Administrador Máster vs. Solo Lectura).

---

## 5. Capa de Visualización y UX/UI Layer

VitalNexus destaca por su estética premium enfocada en el usuario (médicos y especialistas de salud), reduciendo la fricción y proyectando profesionalismo.

### Principios de Diseño Visual
*   **Estética Deep Dark & Cyan Glow:** La landing page de ventas y las áreas públicas emplean fondos oscuros (`deep-dark`) con gradientes lineales cian/azul y sutiles efectos de resplandor animado (glow) al interactuar con botones y tarjetas de beneficios.
*   **Glassmorphism en el Dashboard:** La interfaz de trabajo diaria utiliza contenedores semi-translúcidos con desenfoque de fondo (backdrop-blur) y bordes finos de alto contraste sobre fondos degradados elegantes, otorgando una sensación de modernidad y limpieza.
*   **Tipografía de Alta Legibilidad:** Uso de fuentes de Google de estilo geométrico sin serifa, adaptadas para largas horas de lectura clínica frente a pantallas en tablets o computadoras.

### Características de UX/UI Críticas
1.  **Alertas Médicas Sincronizadas (UX Inteligente):**
    En la parte superior de la Historia Clínica del paciente se muestran banners con colores semánticos (Rojo: Alergias críticas; Naranja: Enfermedades crónicas; Azul: Notas especiales). Estas alertas están sincronizadas bidireccionalmente: al seleccionar antecedentes comunes (ej. Asma, Diabetes, Hipertensión), se autocompletan las alertas superiores de forma inmediata en la base de datos sin recargar la página.
2.  **Buscador Global Inteligente (Command Search):**
    Mediante el atajo de teclado `Ctrl + K`, se despliega una barra de búsqueda omnipresente sobre el dashboard. Permite a los doctores realizar búsquedas difusas de pacientes por cédula o nombre, o navegar de forma instantánea a cualquier sección del sistema (Citas, Inventario, Reportes) usando el teclado.
3.  **Gestión de Modales mediante Portales React:**
    Para resolver el problema común en CSS de modales que quedan recortados por contenedores con propiedades `overflow-hidden`, se implementó `createPortal` en React, proyectando las interfaces de edición complejas directamente en el nodo raíz de la página HTML.
4.  **Línea de Tiempo con Iconografía Intuitiva:**
    La evolución clínica del paciente se muestra en una línea de tiempo vertical animada. Cada hito (consulta, presupuesto, cirugía) cuenta con su propio icono de Lucide, y los archivos adjuntos se previsualizan de forma interactiva con botones separados de visualización e impresión rápida.

---

## 6. Instrucciones para IDEs (AI-DLC Workflow)

Al interactuar con este proyecto para agregar nuevas características o solucionar problemas:
1.  **Validar requerimientos:** No comiences a picar código si los requerimientos de la tarea no están claros en el archivo de planificación correspondiente en la carpeta `requerimientos/`.
2.  **Inyectar RLS:** Recuerda que cualquier nueva consulta o inserción en base de datos dirigida a tablas operativas debe pasar a través del middleware que aplica `especialista_id` mediante RLS en PostgreSQL. No ejecutes consultas directas saltándote esta política.
3.  **Mantener la Inmutabilidad:** En odontogramas o módulos de evolución histórica, no uses `UPDATE` sobre los registros de salud. Inserta nuevos estados con sus marcas de tiempo para no romper la reconstrucción temporal del sistema.
4.  **Consistencia de UX:** Usa las variables CSS predefinidas para Tailwind. Asegura que los componentes mantengan el estilo glassmorphic y utilicen animaciones controladas con `framer-motion` para que la UI no pierda su esencia premium.
