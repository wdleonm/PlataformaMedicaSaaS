from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select, text
from app.database import engine
from app.utils.bcv import fetch_bcv_rates
from app.models.config_global import ConfiguracionGlobal, BCVTasaHistorial
import logging

logger = logging.getLogger(__name__)

# Configuración de Zona Horaria Venezuela
VE_TZ = timezone(timedelta(hours=-4))

class BCVService:
    @staticmethod
    async def sincronizar_tasas(session: Session) -> bool:
        """
        Lógica centralizada para sincronizar tasas BCV, guardar historial y limpiar antiguos.
        Usa zona horaria de Venezuela para consistencia.
        """
        try:
            config = session.exec(select(ConfiguracionGlobal)).first()
            if not config:
                config = ConfiguracionGlobal()
                session.add(config)
            
            logger.info("BCVService: Consultando página oficial del BCV...")
            rates = await fetch_bcv_rates()
            
            if rates and "USD" in rates and "EUR" in rates:
                # Obtenemos la fecha/hora actual en Venezuela
                # La hacemos 'naive' (quitamos el +04:00) para que se guarde literal en la DB y el frontend la vea directa
                ahora_ve = datetime.now(VE_TZ).replace(tzinfo=None)
                
                # 1. Actualizar configuración activa
                config.tasa_usd = rates["USD"]
                config.tasa_eur = rates["EUR"]
                config.bcv_ultima_sincronizacion = ahora_ve
                config.updated_at = ahora_ve
                session.add(config)

                # 2. Guardar en el historial
                log_tasa = BCVTasaHistorial(
                    tasa_usd=rates["USD"],
                    tasa_eur=rates["EUR"],
                    fecha=ahora_ve
                )
                session.add(log_tasa)

                # 3. Limpieza: Eliminar registros antiguos (más de 60 días)
                try:
                    fecha_limite = ahora_ve - timedelta(days=60)
                    stmt_delete = text("DELETE FROM sys_config.bcv_tasas_historial WHERE fecha < :limite")
                    session.execute(stmt_delete, {"limite": fecha_limite})
                except Exception as ex_del:
                    logger.warning("BCVService: No se pudo realizar la limpieza de historial antiguo: %s", ex_del)

                session.commit()
                logger.info("BCVService: Sincronización exitosa (USD: %s, EUR: %s) a las %s", rates["USD"], rates["EUR"], ahora_ve)
                return True
            else:
                logger.error("ALERTA FINANCIERA: La respuesta del BCV no contiene las tasas esperadas.")
                return False
                
        except Exception as e:
            logger.exception("Error crítico en BCVService.sincronizar_tasas: %s", e)
            # Intentar rollback por seguridad
            try:
                session.rollback()
            except:
                pass
            return False
