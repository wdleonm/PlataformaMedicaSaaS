# Estado de la Metodología AI-DLC
**Proyecto:** VitalNexus (PlataformaMedicaSaaS)
**Última Actualización:** 02 de Agosto de 2026
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
- [x] Configuración del Pipeline de CI/CD (Despliegues automáticos con EasyPanel vinculados a Github)
- [ ] Tablero de Observabilidad y Telemetría
- [x] Documentación de Despliegue y Mantenimiento (PASOS_ARRANQUE.md y guías listos)

## Registro de Decisiones y Calidad (16/08/2026 — Módulo de Récipes Médicos, Credenciales y Optimización de Historias Clínicas)
1. **Módulos Modificados & Recursos:**
   - **Módulo de Récipes (Backend/DB):**
     - Creada la tabla `sys_clinical.recipes` y sus políticas RLS mediante `030_recipes_medicos.sql` y `fix_recipes_rls.sql`.
     - Añadidos endpoints CRUD (POST, GET, PATCH, DELETE) para récipes y verificación pública de QR en `/api/recipes`.
   - **Perfil del Especialista:**
     - Añadidos campos `codigo_colegio_medico`, `codigo_mpps`, `codigo_regional` y `mostrar_precios_portal` a través de `029_add_medical_credentials.sql` e integrados al modelo de datos.
   - **Interfaz de Récipes y Vista de Impresión (Frontend):**
     - Desarrollado el componente interactivo `RecipeModal.tsx` con soporte para creación, previsualización, edición y listado de récipes, permitiendo filtrar por consulta o historial general.
     - Implementada técnica de impresión aislada mediante un `iframe` oculto en formato "Media Carta Horizontal" (`size: 8.5in 5.5in landscape`), inyectando el QR dinámico (vía `qrcode.react`) y configurando el título del documento temporalmente para un guardado óptimo del PDF nativo.
   - **Optimización de Alertas Médicas (Historias Clínicas):**
     - Implementado un algoritmo de deduplicación en la cabecera de historia clínica (`historias/page.tsx`) para aislar y limpiar patologías/alergias, corrigiendo de raíz un efecto "bola de nieve" de duplicación de cadenas al redactar nuevas evoluciones.
2. **Validaciones de Calidad y Despliegue:**
   - **Control de Versiones & CI/CD:** Cambios integrados a `main` vía Git, permitiendo el redespliegue directo de contenedores en EasyPanel.
   - **Seguridad y Acceso:** Revisión manual de políticas RLS confirmada y controlada; endpoints REST blindados contra inyecciones y validados por el esquema Pydantic actualizado.

## Registro de Decisiones y Calidad (02/08/2026 — Integración de Video Promocional en Modal de Landing Page)
1. **Módulos Modificados & Recursos:**
   - **Multimedia (`/public/videos`):**
     - Añadido el recurso de video publicitario/demostrativo `DemoVitalNexus.mp4` en `frontend/public/videos/DemoVitalNexus.mp4`.
   - **Frontend (`/src/app/page.tsx`):**
     - Reemplazada la maqueta de imagen estática (`doctor_tablet.png`) y el botón simulado por la etiqueta de reproducción HTML5 nativa `<video>` con atributos `controls`, `autoPlay` y `playsInline`.
2. **Validaciones de Calidad y Despliegue:**
   - **Compilación TypeScript:** Verificación de tipos mediante `tsc --noEmit` de forma 100% limpia.
   - **Sincronización Git & CI/CD VPS:** Cambios integrados y subidos exitosamente a la rama `main` de GitHub (`da3ef90`), desencadenando la reconstrucción y despliegue automático del contenedor frontend en EasyPanel (VPS `147.93.184.194`).

## Registro de Decisiones y Calidad (25/07/2026 — Despliegue a Producción de Historias Clínicas Multiespecialidad)
1. **Módulos Modificados & Refactorizaciones:**
   - **Frontend (`/historias`):**
     - Verificado e integrado el renderizado dinámico de formularios React en [historias/page.tsx](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/frontend/src/app/%28dashboard%29/historias/page.tsx) para las especialidades sanitarias: Medicina General (`ExamenFuncionalStep`), Pediatría (`AntPerinatalesStep`, `PsicomotorStep`, `VacunasStep`, `AntropometriaStep`), Ginecología (`AntGinecoStep`, `ExamenGinecoStep`), Traumatología (`TraumaStep`, `OsteomuscularStep`), Psicología (`BiograficaStep`, `ExamenMentalStep`, `PsicometriaStep`) y Impresión Diagnóstica (`DiagnosticoStep`).
     - Reestructurada la persistencia a las columnas JSONB de la base de datos (`antecedentes_personales`, `antecedentes_familiares`, `examen_clinico`, `diagnostico`).
   - **Backend (`/api/auth/especialidades`):**
     - Filtrado en [auth.py](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/backend/app/api/auth.py) para que la API de registro público solo exponga especialidades con al menos 1 sección activa de historias clínicas.
   - **Base de Datos y Scripts de Migración:**
     - Creado y ejecutado [027_secciones_y_especialidades_medicas.sql](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/scripts/027_secciones_y_especialidades_medicas.sql) para sembrar las 13 secciones clínicas y asociarlas a especialidades.
     - Creado y ejecutado [028_limpiar_especialidades_obsoletas.sql](file:///c:/xampp/htdocs/github/PlataformaMedicaSaaS/scripts/028_limpiar_especialidades_obsoletas.sql) para remover asignaciones genéricas duplicadas (ej: `CONSULTA`, `ANTECEDENTES`) de especialidades con flujos específicos y estandarizar la secuencia de orden (1..N).
2. **Validaciones de Calidad y Despliegue:**
   - **Pruebas de Backend:** Ejecutadas 24/24 pruebas con `pytest` de forma 100% exitosa.
   - **Compilación Frontend:** Validación estricta de tipos de TypeScript mediante `tsc` sin errores de compilación.
   - **Sincronización Git:** Conflicto de merge resuelto y cambios enviados a la rama `main` de GitHub mediante `git push origin main`.
   - **Base de Datos Producción:** Scripts SQL `027` y `028` ejecutados en PostgreSQL del servidor VPS, quedando listo el panel Easypanel para el despliegue automático.

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