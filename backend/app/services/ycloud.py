"""
Servicio YCloud — Cliente HTTP para envío de mensajes WhatsApp.
Fase 4.1 — Regla de Oro 3.4.

Documentación oficial: https://docs.ycloud.com/reference/whatsapp-message-send
Endpoint base:         https://api.ycloud.com/v2

Uso:
    from app.services.ycloud import YCloudService
    ok, error = await YCloudService.enviar_mensaje(destino="58414XXXXXXX", mensaje="Hola!")
"""
import logging
from typing import Optional, Tuple

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

YCLOUD_API_BASE = "https://api.ycloud.com/v2"
TIMEOUT = 10.0          # segundos


class YCloudService:
    """
    Cliente asincrónico para la API de YCloud.

    Cada método devuelve (éxito: bool, error: str | None).
    El llamador decide si registrar el error en ultimo_error o reintentar.
    """

    # ------------------------------------------------------------------
    # Envío de mensaje de texto libre
    # ------------------------------------------------------------------
    @staticmethod
    async def enviar_mensaje(
        destino: str,
        mensaje: str,
        api_key: Optional[str] = None,
        from_number: Optional[str] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Envía un mensaje de texto libre vía WhatsApp.

        Args:
            destino: Número en formato E.164 sin '+' (ej. '58414XXXXXXX').
            mensaje: Texto del mensaje (máx. 4096 caracteres).
            api_key: (Opcional) API Key para usar (sobrescribe la de .env).
            from_number: (Opcional) Número de origen para usar (sobrescribe el de .env).

        Returns:
            (True, None) si el envío fue aceptado por YCloud.
            (False, str) con descripción del error si falló.
        """
        key = api_key or settings.ycloud_api_key
        orig = from_number or settings.ycloud_whatsapp_number

        if not key:
            msg = "YCLOUD_API_KEY no configurada — mensaje no enviado"
            logger.warning(msg)
            return False, msg

        payload = {
            "to":       f"+{destino}",
            "type":     "text",
            "text":     {"body": mensaje},
            "from":     orig,
        }

        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.post(
                    f"{YCLOUD_API_BASE}/whatsapp/messages",
                    json=payload,
                    headers={
                        "X-API-Key":    settings.ycloud_api_key,
                        "Content-Type": "application/json",
                    },
                )
                if response.status_code in (200, 201, 202):
                    logger.info("YCloud: mensaje enviado a +%s", destino)
                    return True, None
                else:
                    error = f"HTTP {response.status_code}: {response.text[:300]}"
                    logger.warning("YCloud error: %s", error)
                    return False, error

        except httpx.TimeoutException:
            error = "Timeout al contactar YCloud API"
            logger.error(error)
            return False, error
        except Exception as exc:
            error = f"Error inesperado YCloud: {exc}"
            logger.exception(error)
            return False, error

    # ------------------------------------------------------------------
    # Plantillas de mensajes por tipo
    # ------------------------------------------------------------------

    @staticmethod
    def construir_mensaje(tipo: str, payload: dict) -> str:
        """
        Construye el texto del mensaje según el tipo y el payload.

        Los valores entre {{ }} se reemplazan con los datos del payload.
        Ajustar estas plantillas según las aprobadas en la cuenta YCloud/Meta.
        """
        templates = {
            "abono_confirmacion": (
                "✅ *Confirmación de abono*\n"
                "Paciente: {paciente_nombre}\n"
                "Monto abonado: *{moneda} {monto}*\n"
                "Saldo pendiente: {moneda} {saldo_pendiente}\n"
                "Fecha: {fecha}\n\n"
                "📄 Ver recibo digital: {recibo_url}\n\n"
                "Gracias por su pago. 🦷"
            ),
            "recordatorio_cita": (
                "📅 *Recordatorio de cita*\n"
                "Estimado/a {paciente_nombre},\n"
                "Le recordamos su cita programada:\n"
                "📆 Fecha y hora: *{fecha_hora}*\n"
                "🩺 Servicio: {servicio_nombre}\n"
                "👨‍⚕️ Especialista: {especialista_nombre}\n\n"
                "Por favor confirme su asistencia. 🦷"
            ),
            "presupuesto_aprobado": (
                "📋 *Presupuesto aprobado*\n"
                "Paciente: {paciente_nombre}\n"
                "Total: *{moneda} {total}*\n"
                "Saldo pendiente: {moneda} {saldo_pendiente}\n\n"
                "Puede realizar abonos en nuestra consulta. 🦷"
            ),
            "cita_cancelada": (
                "❌ *Cita cancelada*\n"
                "Estimado/a {paciente_nombre},\n"
                "Su cita del {fecha_hora} ha sido cancelada.\n"
                "Contáctenos para reagendar. 🦷"
            ),
            "personalizado": "{mensaje}",
        }
        template = templates.get(tipo, "{mensaje}")
        try:
            return template.format(**payload)
        except KeyError as e:
            # Si falta una variable, devolver el template con lo que hay
            logger.warning("YCloud: variable faltante en payload: %s", e)
            return template


class YCloudWebhook:
    """
    Procesador de webhooks entrantes de YCloud.
    YCloud envía actualizaciones de estado (enviado, entregado, leído) y
    mensajes entrantes vía POST al endpoint configurado en el dashboard.
    """

    @staticmethod
    def procesar_status(data: dict) -> Optional[dict]:
        """
        Procesa una actualización de estado de mensaje.

        Retorna un dict con {message_id, status, timestamp} si es válido.
        """
        try:
            return {
                "ycloud_message_id": data.get("id"),
                "status":            data.get("status"),     # sent | delivered | read | failed
                "timestamp":         data.get("timestamp"),
                "error":             data.get("error", {}).get("message"),
            }
        except Exception:
            return None
