# 🏥 VitalNexus — Plataforma Médica SaaS
## Documentación Completa de Funcionalidades para Presentación y Demo

> **Versión:** 1.0 Producción
> **Público Objetivo:** Especialistas de Salud (Médicos, Odontólogos, etc.)
> **Acceso:** https://analytics-vitalnexus-frontend.rojo7o.easypanel.host

---

## 📌 ¿Qué es VitalNexus?

**VitalNexus** es una plataforma de gestión clínica en la nube (SaaS) diseñada especialmente para profesionales de la salud en Venezuela y Latinoamérica. Permite al especialista digitalizar **toda su consulta** desde un solo lugar: pacientes, citas, historias clínicas, inventario, finanzas y comunicaciones con pacientes vía WhatsApp.

### La Promesa Principal

> *"Deja de usar cuadernos, hojas de Excel y grupos de WhatsApp para gestionar tu consulta. VitalNexus lo centraliza todo, te da control financiero real y te hace ver como un profesional de primera clase ante tus pacientes."*

---

## 🔐 Registro y Planes de Suscripción

### Estado Actual del Registro de Especialistas

El sistema **tiene el endpoint de registro funcional** (`POST /api/auth/register`). Sin embargo, la página visual de registro (`/register`) está actualmente como **placeholder (pendiente)** — tiene la infraestructura técnica pero le falta el formulario completo de onboarding.

**Lo que SÍ está implementado:**
- ✅ Endpoint de API `/api/auth/register` funcional
- ✅ El Administrador puede crear especialistas manualmente desde el panel admin
- ✅ Sistema de suscripciones con fecha de vencimiento
- ✅ Sistema de bloqueo automático al vencer la suscripción

**Lo que falta para el registro libre (auto-onboarding):**
- ⚠️ Formulario visual completo en `/register` (actualmente placeholder)
- ⚠️ Asignación automática de plan "Trial 30 días" al registrarse
- ⚠️ Email de bienvenida automático

### 🗂️ Planes Disponibles

| Plan | Precio | Pacientes | Citas | WhatsApp | Multi-Usuario | Soporte |
|------|--------|-----------|-------|----------|---------------|---------|
| **Plan Básico** | $14.99/mes | 100 | 200/mes | ❌ | ❌ | ❌ |
| **Plan Profesional** | $29.99/mes | 500 | Ilimitadas | ✅ | ❌ | ❌ |
| **Plan Enterprise** | $44.99/mes | Ilimitados | Ilimitadas | ✅ | ✅ | ✅ Prioritario |

### 🎁 Plan Trial / Período de Prueba (30 días)

El sistema tiene los campos técnicos para soportar períodos de prueba:
- Campo `fecha_vencimiento_suscripcion` en el modelo de especialista
- Campo `suscripcion_activa` (booleano)
- Bloqueo automático del acceso cuando vence

**Recomendación:** Al implementar el formulario de registro público, asignar automáticamente el **Plan Profesional** con `fecha_vencimiento = hoy + 30 días`. Esto le da al especialista acceso completo por 30 días para evaluar todas las funciones antes de pagar.

---

## 🖥️ Módulos del Sistema

### 1. 📊 Dashboard Principal (Centro de Comando)

El panel de inicio es el corazón del sistema. Al iniciar sesión, el especialista ve en tiempo real:

**KPIs en tiempo real:**
- 🧑‍⚕️ **Pacientes del Mes** — nuevos pacientes y comparativa vs mes anterior
- 📅 **Citas de la Semana** — total programadas vs promedio histórico
- 💰 **Utilidad Neta Real** — ganancia real descontando costos de insumos, merma y gastos fijos
- ⚠️ **Stock Crítico** — alertas de insumos bajo el mínimo

**Secciones:**
- **Agenda de Hoy** — próximas citas con nombre del paciente, hora y estado
- **Pacientes Recientes** — con acceso directo a su historia clínica
- **Rentabilidad por Servicio** — ingresos, costos, merma y margen real por procedimiento
- **Accesos Rápidos** — botones directos a todos los módulos

**Ventaja clave:** El especialista sabe cuánto dinero REALMENTE ganó, no solo cuánto cobró.

---

### 2. 👥 Gestión de Pacientes

Ficha completa de cada paciente:
- Datos personales (nombre, cédula, fecha de nacimiento, edad automática)
- Contacto (teléfono, correo, dirección, WhatsApp)
- Alergias y antecedentes médicos
- Historial de consultas y presupuestos vinculados
- Búsqueda por nombre, documento o estado
- Activar/desactivar pacientes

**Ventaja clave:** Todo el historial del paciente accesible desde cualquier dispositivo con internet.

---

### 3. 📅 Gestión de Citas (Agenda)

Sistema completo de agenda:

**Crear cita:**
- Selección de paciente, servicio, fecha, hora, duración, notas

**Estados de la cita:**
- 🔵 Programada → 🟢 Confirmada → 🟡 En Curso → ✅ Completada / 🔴 Cancelada

**Recordatorio automático por WhatsApp:** El sistema notifica al paciente antes de su cita (requiere plan con WhatsApp).

**Ventaja clave:** Elimina las llamadas manuales de confirmación y reduce el ausentismo hasta un 60%.

---

### 4. 📋 Historias Clínicas Digitales

Sistema modular adaptable a cualquier especialidad médica:

**Secciones por consulta:**
- Motivo de Consulta
- Antecedentes (alergias, medicamentos, historial)
- Examen Físico
- Plan Terapéutico / Diagnóstico

**Características:**
- Múltiples consultas por paciente, organizadas cronológicamente
- Adjuntos: radiografías, fotos clínicas
- Historial inmutable (no se borra, solo se añade)
- Adaptable a Medicina General, Odontología y otras especialidades

**Ventaja clave:** La historia digital protege al especialista legalmente y le permite acceder al expediente desde cualquier lugar.

---

### 5. 🦷 Odontograma Digital Interactivo

Para odontólogos: mapa dental visual completo integrado:

- 32 piezas dentales (adulto) + dentición primaria
- Marcado de hallazgos por diente y por cara (vestibular, lingual, mesial, distal, oclusal)
- Categorías: caries, restauraciones, extracciones, coronas, prótesis, etc.
- Registro con fecha de cada hallazgo
- Modo corrección para borrar hallazgos
- Vista embebida para compartir con otros profesionales
- Catálogo de hallazgos administrable globalmente

**Ventaja clave:** Elimina el odontograma en papel. El mapa dental queda en la nube con historial de cambios.

---

### 6. 📦 Inventario y Catálogo de Servicios

**Gestión de Insumos:**
- Nombre, código, unidad de medida
- Precio de costo, stock actual, stock mínimo
- Alerta automática cuando el stock cae bajo el mínimo
- Unidades por paquete comprado

**Catálogo de Servicios:**
- Nombre, código, categoría, descripción
- Precio de venta en USD
- Duración estimada
- Visibilidad en portal público (activar/desactivar)

**Recetas de Insumos por Servicio (Motor de Costos):**
- Qué materiales se usan en cada procedimiento y en qué cantidad
- Factor de merma (desperdicio del material)
- El sistema calcula automáticamente el costo directo de cada servicio

**Ventaja clave:** El especialista conoce el costo real de cada procedimiento y puede fijar precios rentables con confianza.

---

### 7. 💰 Finanzas: Presupuestos y Cobros

**Presupuestos:**
- Múltiples servicios por presupuesto
- Precio en USD con conversión automática a Bolívares (Bs.)
- Descuentos por ítem o por total
- Estados: Borrador → Aprobado → En Proceso → Completado

**Cobros (Abonos):**
- Pagos parciales o totales
- Métodos de pago: efectivo, transferencia, Zelle, Binance, tarjeta
- Historial de pagos con saldo pendiente automático
- Recibo digital imprimible con logo de la clínica

**Motor Financiero Multi-Moneda:**
- Precios en USD
- Sincronización automática con la tasa del BCV
- Conversión instantánea a Bolívares
- IVA configurable

**Ventaja clave:** El especialista puede aceptar pagos en cualquier moneda con equivalencia en Bs. actualizada al tipo de cambio oficial.

---

### 8. 📊 Gastos Fijos del Consultorio

- Registrar gastos operativos (alquiler, luz, empleados, internet, etc.)
- Categorías personalizables
- Gastos recurrentes mensuales
- El sistema los descuenta automáticamente del cálculo de utilidad neta del dashboard

**Ventaja clave:** La utilidad real del dashboard tiene descontados los gastos fijos. El especialista sabe lo que realmente le queda.

---

### 9. 💬 Comunicaciones por WhatsApp (API Oficial)

Mensajería integrada con YCloud — API oficial de WhatsApp/Meta:

**Tipos de mensajes automáticos:**
- Recordatorio de cita programada
- Confirmación de pago recibido

**Mensajes directos** para comunicaciones puntuales con el paciente.

**Plantillas aprobadas por Meta** — alta tasa de entrega y sin riesgo de bloqueo.

**Ventaja clave:** A diferencia de usar WhatsApp Web (que puede ser bloqueado por Meta), VitalNexus usa la API oficial, garantizando continuidad del servicio de notificaciones.

---

### 10. 🌐 Portal Público del Especialista

Cada especialista tiene su propia página web de perfil profesional:

**URL personalizada:** `https://[dominio]/p/[mi-nombre]`

**Contenido del portal:**
- Foto y logo de la clínica
- Nombre, especialidades y descripción profesional
- Dirección y horarios de atención (por día de la semana)
- Redes sociales (Instagram, Facebook, etc.)
- Catálogo de servicios con precios (opcional)
- Formulario de solicitud de cita

**Ventaja clave:** El especialista tiene presencia web profesional lista en minutos, sin necesidad de contratar un desarrollador web.

---

### 11. 🔒 Seguridad y Perfil

- Cambio de contraseña
- Política de rotación periódica (cada X días)
- Configuración del perfil y foto de la clínica
- Configuración del portal público (slug, visibilidad, horarios, redes sociales)

---

## 🛡️ Panel de Administración SaaS

Panel separado para el dueño de la plataforma:

| Sección | Función |
|---------|---------|
| **Especialistas** | Crear, activar/desactivar, gestionar planes y vencimientos |
| **Planes SaaS** | Crear y editar planes con límites y características |
| **Configuración** | Especialidades médicas, hallazgos odontograma, tasas, IVA, WhatsApp |
| **Dashboard Admin** | Métricas globales, próximas a vencer, nuevos registros |
| **Equipo** | Gestión de usuarios administradores |

---

## 🚀 Ventajas Competitivas

| Ventaja | Descripción |
|---------|-------------|
| **Todo en Uno** | Agenda + Historias + Inventario + Finanzas + WhatsApp en una sola app |
| **Rentabilidad Real** | Calcula el margen real de cada procedimiento descontando insumos y gastos fijos |
| **Profesionalismo** | Portal web, recibos digitales y recordatorios automáticos mejoran la imagen ante el paciente |
| **Adaptado a Venezuela** | USD + Bolívares, tasa BCV automática, pagos en Zelle/Binance/efectivo |
| **Multi-Dispositivo** | Funciona en computadora, tablet y celular (responsive) |
| **Seguridad Total** | Cada especialista tiene sus datos completamente aislados (PostgreSQL RLS) |
| **WhatsApp Oficial** | API certificada por Meta, sin riesgo de bloqueo |

---

## 🗺️ Roadmap — Próximas Funciones

1. **Registro Público** — formulario de auto-registro con Trial 30 días automático
2. **Email de Bienvenida** — instrucciones al registrarse
3. **Multi-Usuario** — asistentes y recepcionistas con acceso limitado
4. **Reportes Avanzados** — gráficas históricas de rentabilidad
5. **App Móvil** — versión nativa iOS/Android (futuro)

---

## 📹 Guía para Video Demostrativo

### Flujo Recomendado (10-15 min)

**Escena 1 — El Problema (2 min)**
> "¿Llevas tu agenda en el teléfono, tus costos en un Excel y le escribes a los pacientes por WhatsApp tú mismo? Hay una mejor forma."

**Escena 2 — El Dashboard (2 min)**
- Login en la plataforma
- Dashboard: KPIs en tiempo real
- Destacar la utilidad neta real y la tabla de rentabilidad

**Escena 3 — Gestión del Día (3 min)**
- Ver la agenda del día
- Abrir una cita → cambiar estado
- Ir a la historia clínica del paciente

**Escena 4 — Inventario y Finanzas (2 min)**
- Mostrar catálogo de servicios con costo calculado
- Crear un presupuesto para un paciente
- Registrar un pago y ver el recibo digital

**Escena 5 — Portal y WhatsApp (2 min)**
- Mostrar el portal público del especialista
- Mencionar el sistema de recordatorios por WhatsApp

**Escena 6 — Call to Action (1 min)**
> "Pruébalo gratis por 30 días. Sin tarjeta de crédito."
> URL de registro + precios de planes

### Herramientas para la Presentación

| Herramienta | Uso |
|-------------|-----|
| **NotebookLM** | Sube este documento → genera podcast o resumen en audio |
| **Gamma.app** | Presentación visual automatizada desde este texto |
| **Canva** | Diapositivas con diseño premium |
| **Loom** | Grabación de pantalla para el video demo |
| **OBS Studio** | Grabación profesional con cámara + pantalla |
| **DaVinci Resolve** | Edición del video final (gratuito y profesional) |

---

## 📞 Datos del Sistema

| Concepto | Valor |
|----------|-------|
| URL Producción | https://analytics-vitalnexus-frontend.rojo7o.easypanel.host |
| Panel Admin | /admin/login |
| Correo Soporte | smartlift1608@gmail.com |
| WhatsApp Soporte | +58 0412-4444621 |

---

*VitalNexus © 2026 — Plataforma Médica SaaS | Documento de funcionalidades v1.0*
