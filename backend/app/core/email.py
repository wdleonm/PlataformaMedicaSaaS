import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def send_new_registration_email(nombre: str, apellido: str, email: str, telefono: str):
    """
    Envía un correo de notificación a los administradores cuando un nuevo especialista se registra.
    Esto se ejecuta idealmente como una tarea en segundo plano (BackgroundTasks).
    """
    # Usamos variables de entorno para las credenciales
    smtp_server = settings.smtp_host
    smtp_port = settings.smtp_port
    smtp_username = settings.smtp_user
    smtp_password = settings.smtp_password

    admin_emails = ["smartlift1608@gmail.com", "wdleonm@gmail.com"]

    if not smtp_username or not smtp_password:
        logger.warning("SMTP credentials not configured. Skipping registration email.")
        return

    subject = f"🚀 Nuevo Especialista Registrado: {nombre} {apellido}"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #009688;">¡Tenemos un nuevo registro en VitalNexus! 🎉</h2>
            <p>Un nuevo especialista se ha registrado y ha comenzado su prueba gratuita de 30 días.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Nombre:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{nombre} {apellido}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Correo:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{email}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Teléfono:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{telefono if telefono else "No proporcionado"}</td>
                </tr>
            </table>
            <p style="margin-top: 30px; font-size: 14px; color: #777;">
                Es un excelente momento para contactarlo y darle la bienvenida a la plataforma.
            </p>
        </div>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"VitalNexus Notificaciones <{smtp_username}>"
    msg["To"] = ", ".join(admin_emails)

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_username, admin_emails, msg.as_string())
        server.quit()
        logger.info(f"Registration email sent successfully for {email}")
    except Exception as e:
        logger.error(f"Failed to send registration email: {e}")
