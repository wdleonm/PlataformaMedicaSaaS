-- Odonto-Focus | Fase 11: Perfil del Especialista y Datos de Clínica
-- Ejecutar sobre la base de datos para añadir campos de perfil profesional

SET search_path TO sys_config, public;

ALTER TABLE sys_config.especialistas 
    ADD COLUMN IF NOT EXISTS redes_sociales JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS clinica_nombre VARCHAR(200),
    ADD COLUMN IF NOT EXISTS clinica_logo_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS clinica_direccion TEXT;

COMMENT ON COLUMN sys_config.especialistas.redes_sociales IS 'Diccionario con links a RRSS (Instagram, Facebook, etc).';
COMMENT ON COLUMN sys_config.especialistas.clinica_nombre IS 'Nombre comercial del consultorio o clínica.';
COMMENT ON COLUMN sys_config.especialistas.clinica_direccion IS 'Dirección física detallada para mostrar en recibos.';
