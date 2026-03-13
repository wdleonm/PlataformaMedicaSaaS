-- Odonto-Focus | Fase 7: Panel de Administración SaaS
-- Ejecutar sobre la base de datos: analytics
-- Requiere scripts 001 al 006 aplicados previamente.

SET search_path TO sys_config, public;

-- =============================================================================
-- 7.1a Tabla: planes_suscripcion (maestra global)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.planes_suscripcion (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(30) NOT NULL UNIQUE,       -- basico, profesional, enterprise
    nombre              VARCHAR(100) NOT NULL,
    precio_mensual      NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_pacientes       INTEGER,                           -- NULL para ilimitado
    max_citas_mes       INTEGER,                           -- NULL para ilimitado
    incluye_whatsapp    BOOLEAN NOT NULL DEFAULT false,
    incluye_multiusuario BOOLEAN NOT NULL DEFAULT false,
    activo              BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_config.planes_suscripcion IS 'Catálogo de planes de suscripción ofrecidos por la plataforma.';

-- Seed de planes iniciales
INSERT INTO sys_config.planes_suscripcion (codigo, nombre, precio_mensual, max_pacientes, max_citas_mes, incluye_whatsapp, incluye_multiusuario)
VALUES
    ('basico',      'Plan Básico',      29.99, 100,  200,  false, false),
    ('profesional', 'Plan Profesional', 59.99, 500,  NULL, true,  false),
    ('enterprise',  'Plan Enterprise',  99.99, NULL, NULL, true,  true)
ON CONFLICT (codigo) DO NOTHING;

-- =============================================================================
-- 7.1b Campos adicionales en especialistas (suscripción)
-- =============================================================================
ALTER TABLE sys_config.especialistas 
    ADD COLUMN IF NOT EXISTS plan_suscripcion_id UUID REFERENCES sys_config.planes_suscripcion(id),
    ADD COLUMN IF NOT EXISTS suscripcion_activa BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS fecha_vencimiento_suscripcion DATE,
    ADD COLUMN IF NOT EXISTS notas_admin TEXT;

COMMENT ON COLUMN sys_config.especialistas.plan_suscripcion_id IS 'Plan contratado actualmente por el especialista.';
COMMENT ON COLUMN sys_config.especialistas.suscripcion_activa IS 'Flag para bloqueo rápido de acceso por pagos o términos.';

-- Asignar plan básico a especialistas existentes si no tienen uno
DO $$
DECLARE
    v_plan_id UUID;
BEGIN
    SELECT id INTO v_plan_id FROM sys_config.planes_suscripcion WHERE codigo = 'basico';
    
    UPDATE sys_config.especialistas 
    SET plan_suscripcion_id = v_plan_id 
    WHERE plan_suscripcion_id IS NULL;
END $$;

-- =============================================================================
-- 7.1c Tabla: administradores (Dueños del sistema)
-- Sin RLS - Acceso global a todas las configuraciones.
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.administradores (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nombre         VARCHAR(120) NOT NULL,
    apellido       VARCHAR(120) NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_config.administradores IS 'Usuarios con privilegios administrativos para gestionar especialistas y planes.';

-- Seed admin inicial (contraseña: admin123 - el usuario debe cambiarla)
-- Hash generado para 'admin123'
INSERT INTO sys_config.administradores (email, password_hash, nombre, apellido)
VALUES ('admin@odonto-focus.com', '$2b$12$LQv3c1yqBWVHxkd0LqZGueOQ/RGxOF8B9gZ8S8D8T7p8Z8X8S8D8T', 'Admin', 'SaaS')
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 7.1d Tabla: log_suscripciones (Auditoría)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.log_suscripciones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id UUID NOT NULL REFERENCES sys_config.especialistas(id),
    admin_id        UUID REFERENCES sys_config.administradores(id),
    cambio          JSONB NOT NULL,                   -- {de: uuid, a: uuid} o {estado: false}
    motivo          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_susc_especialista ON sys_config.log_suscripciones (especialista_id);

-- Actualizar triggers de updated_at
CREATE TRIGGER planes_suscripcion_updated_at
    BEFORE UPDATE ON sys_config.planes_suscripcion
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

CREATE TRIGGER administradores_updated_at
    BEFORE UPDATE ON sys_config.administradores
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();
