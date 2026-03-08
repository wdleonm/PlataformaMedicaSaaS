-- Odonto-Focus | Fase 2.1: Pacientes (Esquema Transaccional)
-- Ubicación: sys_clinical
-- Referencias: sys_config

-- 1. Asegurar que el esquema transaccional exista
CREATE SCHEMA IF NOT EXISTS sys_clinical AUTHORIZATION postgres;

-- 2. Configurar el camino de búsqueda para esta sesión
SET search_path TO sys_clinical, sys_config, public;

-- =============================================================================
-- 1. Tabla: pacientes
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_clinical.pacientes (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Referencia explícita al esquema de configuración
    especialista_id  UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,
    nombre           VARCHAR(120) NOT NULL,
    apellido         VARCHAR(120) NOT NULL,
    documento        VARCHAR(50),
    telefono         VARCHAR(50),
    email            VARCHAR(255),
    fecha_nacimiento DATE,
    activo           BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_clinical.pacientes IS 'Pacientes asociados a un especialista (tenant). Ubicada en esquema transaccional.';
COMMENT ON COLUMN sys_clinical.pacientes.especialista_id IS 'Referencia al tenant en sys_config; se usa para RLS.';

-- =============================================================================
-- 2. Seguridad (RLS)
-- =============================================================================
ALTER TABLE sys_clinical.pacientes ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento por especialista
CREATE POLICY pacientes_tenant ON sys_clinical.pacientes
    FOR ALL
    USING (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

-- =============================================================================
-- 3. Índices para Optimización de Consultas
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_pacientes_especialista ON sys_clinical.pacientes (especialista_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON sys_clinical.pacientes (nombre, apellido);
CREATE INDEX IF NOT EXISTS idx_pacientes_documento ON sys_clinical.pacientes (documento);

-- =============================================================================
-- 4. Trigger de updated_at
-- =============================================================================
-- Se utiliza la función definida previamente en sys_config
DROP TRIGGER IF EXISTS pacientes_updated_at ON sys_clinical.pacientes;
CREATE TRIGGER pacientes_updated_at
    BEFORE UPDATE ON sys_clinical.pacientes
    FOR EACH ROW
    EXECUTE PROCEDURE sys_config.set_updated_at();