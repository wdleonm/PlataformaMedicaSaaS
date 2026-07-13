# Plan de Refactorización UI/UX: Stitch Clinical Precision

Este documento detalla el paso a paso de la refactorización visual del frontend de la Plataforma Médica SaaS. El objetivo es adoptar la estética "Stitch Clinical Precision" (Deep Dark / Clinical Clean, Glassmorphism, Micro-interacciones) **sin alterar la funcionalidad base, hooks o endpoints**.

---

## 🎯 Regla de Oro
- **No modificar** llamadas a `api.get()`, `api.post()`, ni lógica de `useEffect` o de autenticación (`useAuth()`).
- Reemplazar las clases base de Tailwind (ej. `bg-card`) por los nuevos *tokens* semánticos (ej. `bg-surface-container-low`) descritos en `clinical_precision/DESIGN.md`.

---

## 📅 Roadmap de Ejecución

### Fase 0: Sandbox de Validación
- [x] Previsualización y validación de la Landing Page pública (Hero, Precios, Beneficios). *(Completado)*

### Fase 1: Setup Global y Layout Base
- [x] **Tailwind Config:** Inyectar los tokens de color (`surface-container-highest`, `primary-fixed`, etc.) desde `clinical_precision/DESIGN.md` a `tailwind.config.ts`.
- [x] **Globals CSS:** Añadir las clases utilitarias de Stitch (`.glass-panel`, `.cyan-glow`).
- [x] **Layout Principal (`/app/(dashboard)/layout.tsx`):**
  - Refactorizar el Sidebar (Menú lateral izquierdo) con los nuevos estilos y colores.
  - Refactorizar el Top Navigation Bar (Buscador, Notificaciones, Avatar).
  - Adoptar la tipografía dual (`Geist` para encabezados/labels, `Inter` para cuerpo).

### Fase 2: Panel Central (Command Center)
- [x] **Dashboard (`/app/(dashboard)/dashboard/page.tsx`):**
  - Aplicar el diseño basado en `dashboard_cl_nico_v2`.
  - Refactorizar las tarjetas de KPIs (Pacientes, Citas, Utilidad Neta) con la estética `glass-panel` y `cyan-glow`.
  - Estilizar la tabla de rentabilidad y la sección de agenda del día.

### Fase 3: Operaciones Médicas (Citas y Pacientes)
- [x] **Directorio de Pacientes (`/app/(dashboard)/pacientes/page.tsx`):**
  - Aplicar `surface-container` al layout.
  - Asegurar que la tabla y modales de "Crear/Editar Paciente" respeten la estética.
- [x] **Agenda Médica (`/app/(dashboard)/citas/page.tsx`):**
  - Actualizar los colores de los estados de citas (`programada`, `completada`, etc.) para que armonicen con `cyan-glow` sin desentonar.

### Fase 4: Flujo Clínico (Historias y Odontograma)
- [x] **Historias Clínicas (`/app/(dashboard)/historias/page.tsx`):**
  - Refactorizar el timeline cronológico y modales de registro de notas.
- [x] **Odontograma (`/app/(dashboard)/odontograma/page.tsx`):**
  - Asegurar que la interfaz del lienzo de dientes (SVG/Canvas) no colisione con el nuevo fondo Dark Mode.

### Fase 5: Gestión Financiera
- [x] **Presupuestos (`/app/(dashboard)/presupuestos/page.tsx`):**
  - Actualizar estilo de tablas de cobros, y botones de "Registrar Abono".
- [x] **Gastos Fijos (`/app/(dashboard)/gastos-fijos/page.tsx`):**
  - Refactorización de tabla de recurrencia y modales.

### Fase 6: Inventario y Clínica
- [x] **Inventario (`/app/(dashboard)/inventario/page.tsx`):**
  - Resaltar semánticamente los niveles bajos (`text-error`, `bg-error-container`).

### Fase 7: CRM y Comunicaciones
- [x] **Comunicaciones (`/app/(dashboard)/comunicaciones/page.tsx`):**
  - Actualizar los *chat bubbles* y plantillas de correo/WhatsApp con Glassmorphism.

### Fase 8: Administración del Sistema
- [x] **Configuración (`/app/(dashboard)/configuracion/page.tsx`) y Seguridad (`/app/(dashboard)/seguridad/page.tsx`).**

### Fase 9: Autenticación y Perfil
- [x] Refactor de `/app/(auth)/login/page.tsx` y recuperación de contraseñas.
- [x] Refactor del Portal Público del Doctor (`/app/p/[slug]/page.tsx`).

### Fase 10: Auditoría Final
- [x] Revisión General (QA) del diseño responsivo en móvil.
- [x] Validación estricta del switch "Modo Claro" / "Modo Oscuro" (verificando contrastes en tablas y modales).
