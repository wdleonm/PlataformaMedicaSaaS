# Estado de la Metodología AI-DLC
**Proyecto:** VitalNexus (PlataformaMedicaSaaS)
**Última Actualización:** 25 de Julio de 2026
**Fase Actual:** Operations / WhatsApp & YCloud Integration (Rama `main`)
**Convención Git:** Siempre trabajar sobre `main` directamente, salvo indicación explícita del usuario.

## Estado de Entregables por Fase
### 1. Fase de Inception
- [x] Product Backlog Validado (Ubicación: `/requerimientos/`)
- [x] Criterios de Aceptación de Historias de Usuario
- [x] Diseño Arquitectónico y Modelo de Datos

### 2. Fase de Construction
- [x] Implementación de Código de la Aplicación (Fases 1–12 completas)
- [x] Pruebas Unitarias e Integración (23 pruebas aprobadas con éxito en rama metodologia_dlc)
- [x] Rediseño UI/UX de Landing Page Pública y Sección de Precios (Estilo Clinical Precision)
- [x] Definición de Infraestructura como Código (IaC) (Docker y Docker Compose listos)
- [x] Estandarización de Interfaz Glassmorphism y Soporte Tema Claro/Oscuro en Módulos y Admin (08/06/2026)
- [x] Auditoría Final y Ajustes de Visibilidad de Servicios y Receta (10/06/2026)
- [x] Toggle Inline de Visibilidad Pública en Tabla de Servicios + Corrección de Bugs Toast (10/06/2026)

### 3. Fase de Operations
- [ ] Configuración del Pipeline de CI/CD (Despliegues automáticos con EasyPanel vinculados a Github)
- [ ] Tablero de Observabilidad y Telemetría
- [x] Documentación de Despliegue y Mantenimiento (PASOS_ARRANQUE.md y guías listos)

## Registro de Decisiones y Calidad (25/07/2026 — Limpieza de Relaciones Obsoletas de Especialidades en Historias Clínicas)
1. **Módulos Modificados:**
   - **Base de Datos / Migración de Depuración:**
     - Creado y ejecutado el script de migración [028_limpiar_especialidades_obsoletas.sql](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/scripts/028_limpiar_especialidades_obsoletas.sql) para depurar las relaciones genéricas u obsoletas heredadas en `sys_config.especialidad_hc_secciones` (ej. `CONSULTA`, `ANTECEDENTES`, `ACTIVIDADES`) en especialidades con flujos dedicados como Medicina General y Psicología.
     - Estandarizados los números de orden (1..N) de las pestañas dinámicas por especialidad.
   - **Suite de Pruebas:**
     - Ejecutada la suite completa con 24/24 pruebas pasando exitosamente en Pytest.

## Registro de Decisiones y Calidad (25/07/2026 — Filtrado de Especialidades y Registro de Nuevas Secciones Médicas)
1. **Módulos Modificados:**
   - **Registro de Suscripción Pública (Backend):**
     - Modificado `/api/auth/especialidades` en [auth.py](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/backend/app/api/auth.py) para que filtre y devuelva únicamente aquellas especialidades médicas que tengan al menos una sección de historia clínica activa configurada en `sys_config.especialidad_hc_secciones`.
   - **Base de Datos / Semillas:**
     - Creado y ejecutado el script de migración [027_secciones_y_especialidades_medicas.sql](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/scripts/027_secciones_y_especialidades_medicas.sql) para registrar 13 nuevas secciones de historia clínica (Medicina General, Pediatría, Ginecología, Traumatología, Psicología) y asociarlas a sus respectivas especialidades.
   - **Suite de Pruebas:**
     - Agregada prueba unitaria `test_get_especialidades_filtered` en [test_auth.py](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/backend/tests/test_auth.py).
     - Corregidos errores de validación (422) en las pruebas de registro en [test_auth.py](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/backend/tests/test_auth.py) y [conftest.py](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/backend/tests/conftest.py) asegurando que usen dominios correctos y pasen el `turnstile_token`.
2. **Validaciones de Calidad:**
   - Pruebas unitarias ejecutadas y aprobadas (24/24 exitosas).

## Registro de Decisiones y Calidad (13/07/2026 — Corrección y Flexibilización de CAPTCHA Turnstile en Registro Público)
1. **Módulos Modificados:**
   - **Backend (Configuración y Validación de CAPTCHA):**
     - [config.py](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/backend/app/config.py): Añadido el flag `turnstile_enabled: bool = True` para controlar la validación del CAPTCHA mediante variables de entorno.
     - [auth.py](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/backend/app/api/auth.py): Modificada la ruta de registro público (`POST /api/auth/register`) para omitir la solicitud externa de verificación a Cloudflare cuando `settings.turnstile_enabled` es `False`, retornando éxito inmediatamente.
   - **Frontend (Interfaz Dinámica del CAPTCHA):**
     - [register/page.tsx](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/frontend/src/app/(auth)/register/page.tsx): Reemplazado el widget de Cloudflare Turnstile por un checkbox interactivo animado ("No soy un robot") cuando no existe una Site Key configurada o cuando `NEXT_PUBLIC_TURNSTILE_ENABLED` está explícitamente en `false`. Esto previene el bloqueo de la UI ante errores de red o configuraciones locales/dev.
   - **Documentación de Entorno:**
     - [.env.example](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/.env.example): Actualizado para detallar el uso de `TURNSTILE_ENABLED` y `NEXT_PUBLIC_TURNSTILE_ENABLED` para activar o desactivar la verificación real de Cloudflare.
2. **Validaciones de Calidad Realizadas:**
   - **Verificación de Tipos TypeScript:** Corregida la firma en la función callback `onSuccess` de Turnstile para evitar tipos implícitos `any` (`token: string`). Compilación validada mediante `npx tsc --noEmit` de forma exitosa y limpia.
   - **Configuración de Producción:** Se guiaron los pasos en Cloudflare de producción (`Smartlift1608@gmail.com` -> Widget *VitalNexus Register*) para registrar correctamente el dominio de producción `vitalnexusmed.com` y el subdominio de Easypanel, restaurando el funcionamiento del CAPTCHA real sin errores.