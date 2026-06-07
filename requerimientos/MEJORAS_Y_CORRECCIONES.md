# Historial de Mejoras y Correcciones — VitalNexus

Este documento centraliza el registro de actividades, hitos alcanzados y correcciones técnicas realizadas durante el desarrollo del sistema.

---

## 🚀 Hitos de Desarrollo Completados

### ✅ Fase 1: Infraestructura y Core
*Completado según FASE1_COMPLETADA.md*
- **Docker & Infra**: Configuración de `docker-compose.yml` con Postgres, Backend, Frontend y Redis.
- **Base de Datos**: Implementación de SQLModel con pool de conexiones y health-checks.
- **Seguridad RLS**: Activación de Row Level Security (RLS) en PostgreSQL para aislamiento multi-tenant basado en `especialista_id`.
- **Autenticación**: Sistema de Registro/Login con JWT administrando el contexto de sesión.
- **Tenant Context**: Middleware para inyectar automáticamente el ID del especialista en cada transacción de base de datos.

### ✅ Fase 5.1: Interfaz de Usuario e Inicio de Sesión
*Completado según FASE5.1_COMPLETADA.md*
- **Stack Frontend**: Next.js (App Router), Tailwind CSS y Framer Motion para animaciones premium.
- **Sistema Visual**: Implementación de temática Glassmorphism y Dark Mode.
- **Auth Context**: Persistencia de sesión y manejo de redirecciones globales (401).
- **Dashboard Layout**: Menú lateral dinámico con perfil de especialista y navegación protegida.

### ✅ Módulo de Pacientes y UI Base
*Completado según AVANCES_UI.md*
- **CRUD de Pacientes**: Gestión completa (Crear, Ver, Editar, Eliminar) con búsqueda incremental.
- **Validaciones**: Máscaras estrictas para Cédula (V-0000) y Teléfono (+58).
- **UI Premium**: Modales animados y notificaciones de éxito/error.

### ✅ Odontograma Evolutivo FDI
- **Visualización Fractal**: Representación gráfica de todas las piezas dentales permanentes y temporales.
- **Histórico**: Sistema de registros que nunca sobreescribe, permitiendo ver el estado del paciente en cualquier fecha pasada.
- **Integración**: Acceso directo desde la Historia Clínica sin interrumpir el flujo de trabajo.

---

## 🛠️ Correcciones Técnicas y Depuración (Bitácora de Sesiones)

### 🦷 Correcciones en Odontograma y UI
- **Conflicto de Layout**: Se movió el odontograma a una ruta `/embed` para evitar que el sidebar del dashboard se duplicara dentro del iframe.
- **SVG Metadata**: Se eliminaron tags `<title>` internos que causaban errores de hidratación en React.
- **Scrollbars**: Limpieza visual de barras de scroll innecesarias en el historial clínico.

### 💰 Mejoras Financieras y Presupuestos
- **Sincronización de Totales**: Ajuste en los triggers de base de datos para asegurar que el `saldo_pendiente` se actualice instantaneamente al registrar abonos.
- **Visualización de Precios**: Corrección en el formato de moneda y decimales en el reporte de rentabilidad.
- **Depuración de Casos Reales**: Pruebas con servicios de Endodoncia y Tratamientos de Conducto para validar cálculos de utilidad neta.

### 🔒 Seguridad y Sesión
- **Expiración de Sesión**: Implementado sistema de aviso por inactividad (55 min) con modal de cuenta regresiva y redirección manejada a Login.
- **Recuperación de Acceso**: Optimización del interceptor 401 para evitar estados bloqueados ("pantallas en blanco") cuando el token caduca.

---

## 📂 Archivos Consolidados y Eliminados
*(Para referencia de limpieza del proyecto)*
- `FASE1_COMPLETADA.md` -> Movido a este historial.
- `FASE5.1_COMPLETADA.md` -> Movido a este historial.
- `AVANCES_UI.md` -> Movido a este historial.
- `scripts/debug_*.txt` -> Datos técnicos de casos de prueba (Endodoncia, Presupuestos 600+) analizados y consolidados.
- `scripts/detalles_debug*.txt` -> Notas de depuración manual.
