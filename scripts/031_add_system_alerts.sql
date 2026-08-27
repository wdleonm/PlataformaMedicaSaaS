-- Odonto-Focus | Fase 10: Alertas de Mantenimiento y Actualizaciones Obligatorias
-- Ejecutar sobre la base de datos: analytics

SET search_path TO sys_config, public;

-- Agregar columnas a la tabla de configuración global
ALTER TABLE sys_config.configuracion_global 
    ADD COLUMN IF NOT EXISTS alerta_mantenimiento_activa BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS alerta_mantenimiento_mensaje TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS version_minima_app VARCHAR(20) NOT NULL DEFAULT '1.0.0';

-- Comentarios explicativos
COMMENT ON COLUMN sys_config.configuracion_global.alerta_mantenimiento_activa IS 'Indica si hay un mensaje de alerta de mantenimiento activo que deba mostrarse a los usuarios.';
COMMENT ON COLUMN sys_config.configuracion_global.alerta_mantenimiento_mensaje IS 'El texto del banner de alerta de mantenimiento.';
COMMENT ON COLUMN sys_config.configuracion_global.version_minima_app IS 'Versión mínima requerida de la aplicación frontend para forzar recargas.';
