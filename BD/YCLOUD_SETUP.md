# Configuración de YCloud y WhatsApp (Fases 8.3.2 y 8.3.3)

Este documento describe paso a paso cómo configurar la integración oficial de WhatsApp en VitalNexus utilizando **YCloud**.

---

## 1. Cuenta de YCloud e Integración de Meta

1.  **Regístrate** en [YCloud](https://www.ycloud.com/).
2.  Accede a la sección **WhatsApp** en tu consola de YCloud.
3.  Conecta tu cuenta de **Meta Business Manager**. A través de este flujo (Embedded Signup), podrás:
    *   Verificar tu empresa (si es necesario).
    *   Registrar tu número oficial de WhatsApp.
    *   Aprobar el número para el envío de mensajes.
4.  En la consola de YCloud, genera una **API Key** (sección *API Keys*).
5.  Copia tu API Key y tu número de teléfono registrado en formato E.164 (ejemplo para Venezuela: `584141234567`, sin el signo `+`).

---

## 2. Configurar en VitalNexus

Ingresa al panel administrativo de VitalNexus como Master Admin en la ruta `/admin/config` (o edita el archivo de entorno `.env` en producción):

*   **YCloud API Key:** Pega la API Key que obtuviste en el paso anterior.
*   **Origen WhatsApp (E.164):** Ingresa tu número verificado (ej. `584141234567`).

---

## 3. Crear y Registrar las Plantillas en Meta / YCloud

Para enviar mensajes proactivos (fuera de la ventana de chat de 24 horas), Meta exige el uso de **plantillas (Templates)** pre-aprobadas. Debes registrar las siguientes dos plantillas exactamente con estas variables en el Business Manager de Meta o directamente desde la consola de YCloud:

### Plantilla 1: `recordatorio_cita`

*   **Categoría:** Utility (Utilidad)
*   **Idioma:** Español (`es`)
*   **Cuerpo del Mensaje (Template Body):**
    ```text
    📅 *Recordatorio de cita*
    Estimado/a {{1}}, le recordamos su cita programada:
    📆 Fecha y hora: *{{2}}*
    🩺 Servicio: {{3}}
    👨‍⚕️ Especialista: {{4}}

    Por favor confirme su asistencia. 🦷
    ```
*   **Mapeo de Variables (automático en VitalNexus):**
    *   `{{1}}`: Nombre y apellido del paciente.
    *   `{{2}}`: Fecha y hora formateadas (ej. `25/05/2026 10:00`).
    *   `{{3}}`: Nombre del servicio (ej. `Limpieza Dental`).
    *   `{{4}}`: Nombre y apellido del especialista.

---

### Plantilla 2: `abono_confirmacion`

*   **Categoría:** Utility (Utilidad)
*   **Idioma:** Español (`es`)
*   **Cuerpo del Mensaje (Template Body):**
    ```text
    ✅ *Confirmación de abono*
    Paciente: {{1}}
    Monto abonado: *{{2}}*
    Saldo pendiente: {{3}}
    Fecha: {{4}}

    📄 Ver recibo digital: {{5}}

    Gracias por su pago. 🦷
    ```
*   **Mapeo de Variables (automático en VitalNexus):**
    *   `{{1}}`: Nombre y apellido del paciente.
    *   `{{2}}`: Monto abonado con su símbolo de moneda (ej. `Bs. 1,500.00`).
    *   `{{3}}`: Saldo pendiente del presupuesto con su moneda (ej. `Bs. 300.00`).
    *   `{{4}}`: Fecha del abono (ej. `2026-05-24`).
    *   `{{5}}`: Enlace web al recibo digital interactivo (ej. `https://tudominio.com/recibo/uuid`).

---

## 4. Webhooks de Estados (Opcional - Para confirmación de entrega)

En la consola de YCloud, puedes configurar un Webhook apuntando a tu servidor para recibir las confirmaciones de lectura y entrega:
*   **URL de Webhook:** `https://api.tudominio.com/api/v2/webhooks/ycloud` (o la ruta correspondiente de tu backend expuesto en producción).
