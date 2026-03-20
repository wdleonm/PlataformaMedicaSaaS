"""
Servicio de Correo — Cliente SMTP para envío de notificaciones.
Fase 9.5 — Integración básica de Email.
"""
import logging
import smtplib
import asyncio
from email.message import EmailMessage
from typing import Tuple, Optional
from concurrent.futures import ThreadPoolExecutor

from app.config import settings

logger = logging.getLogger(__name__)
executor = ThreadPoolExecutor(max_workers=3)

class EmailService:
    """
    Servicio para el envío de correos electrónicos vía SMTP.
    Utiliza smtplib (sincrónico) envuelto en un executor para no bloquear el loop.
    """

    @staticmethod
    def _enviar_sync(destino: str, asunto: str, cuerpo: str) -> Tuple[bool, Optional[str]]:
        """Lógica síncrona de envío SMTP."""
        if not settings.smtp_user or not settings.smtp_password:
            return False, "Credenciales SMTP no configuradas"

        msg = EmailMessage()
        msg.set_content(cuerpo)
        msg["Subject"] = asunto
        msg["From"] = settings.smtp_from
        msg["To"] = destino

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)
                return True, None
        except Exception as e:
            return False, str(e)

    @classmethod
    async def enviar_mensaje(
        cls, 
        destino: str, 
        cuerpo: str, 
        asunto: str = "Notificación de VitalNexus"
    ) -> Tuple[bool, Optional[str]]:
        """Envía un correo de forma asíncrona."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(executor, cls._enviar_sync, destino, asunto, cuerpo)

    @staticmethod
    def construir_correo(tipo: str, payload: dict) -> Tuple[str, str]:
        """
        Adapta el texto de las plantillas para formato Email.
        Devuelve (Asunto, Cuerpo).
        """
        templates = {
            "recordatorio_cita": (
                "Recordatorio de tu Cita - VitalNexus",
                "📅 Hola {paciente_nombre},\n\n"
                "Le recordamos su cita programada en nuestra clínica:\n\n"
                "• Fecha y Hora: {fecha_hora}\n"
                "• Servicio: {servicio_nombre}\n"
                "• Especialista: {especialista_nombre}\n\n"
                "¡Le esperamos! 🦷"
            ),
            "abono_confirmacion": (
                "Confirmación de Pago - VitalNexus",
                "✅ Hola {paciente_nombre},\n\n"
                "Hemos registrado su pago satisfactoriamente:\n\n"
                "• Monto: {moneda} {monto}\n"
                "• Saldo Pendiente: {moneda} {saldo_pendiente}\n"
                "• Fecha: {fecha}\n\n"
                "Ver Recibo Digital: {recibo_url}\n\n"
                "Gracias por su preferencia. 🦷"
            ),
            "personalizado": ("Notificación Importante - VitalNexus", "{mensaje}"),
        }
        
        tpl = templates.get(tipo, ("Notificación VitalNexus", "{mensaje}"))
        asunto = tpl[0]
        cuerpo = tpl[1]
        
        try:
            return asunto, cuerpo.format(**payload)
        except Exception:
            return asunto, cuerpo
