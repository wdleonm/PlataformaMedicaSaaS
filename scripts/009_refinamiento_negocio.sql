-- Odonto-Focus | Fase 9: Refinamiento de Negocio, Rentabilidad y Portal Público
-- Ejecutar sobre la base de datos: analytics

SET search_path TO sys_config, public;

-- =============================================================================
-- 9.1a Campos para el Portal Público en especialistas
-- =============================================================================
ALTER TABLE sys_config.especialistas 
    ADD COLUMN IF NOT EXISTS slug_url VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS portal_visible BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS descripcion_perfil TEXT,
    ADD COLUMN IF NOT EXISTS horario_atencion JSONB; -- { "lunes": ["08:00", "17:00"], ... }

COMMENT ON COLUMN sys_config.especialistas.slug_url IS 'URL amigable para el portal de pacientes (ej: dr-perez)';
COMMENT ON COLUMN sys_config.especialistas.horario_atencion IS 'Configuración de disponibilidad para auto-agendamiento';

-- Generar slugs iniciales basados en nombre/apellido para evitar nulls en UNIQUE (opcional)
-- UPDATE sys_config.especialistas 
-- SET slug_url = lower(nombre || '-' || apellido || '-' || substr(id::text, 1, 4))
-- WHERE slug_url IS NULL;

-- =============================================================================
-- 9.1b Campos en Servicios para visibilidad pública
-- =============================================================================
ALTER TABLE sys_config.servicios
    ADD COLUMN IF NOT EXISTS visible_publico BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS duracion_estimada_min INTEGER DEFAULT 30;

COMMENT ON COLUMN sys_config.servicios.duracion_estimada_min IS 'Duración en minutos para el bloqueo de agenda automático';

-- =============================================================================
-- 9.1c Tabla para capturar "Prospectos" o Pacientes Autoregistrados
-- =============================================================================
-- Nota: Ya tenemos la tabla pacientes, pero podrías querer marcar el origen.
ALTER TABLE sys_clinical.pacientes
    ADD COLUMN IF NOT EXISTS origen_registro VARCHAR(20) DEFAULT 'interno'; -- 'interno' o 'portal_publico'

-- =============================================================================
-- 9.1d Mejoras en Presupuestos/Abonos para Recibos
-- =============================================================================
-- Ya tenemos abonos, pero agreguemos un campo de "referencia_pago" (nro de transaccion)
ALTER TABLE sys_clinical.abonos
    ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(100),
    ADD COLUMN IF NOT EXISTS medio_pago VARCHAR(50); -- 'efectivo', 'transferencia', 'pago_movil'
