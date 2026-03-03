-- Odonto-Focus | Fase 1: Especialidades, Especialistas y RLS
-- Ejecutar como superusuario o dueño de la base de datos.
-- Requiere extensión uuid-ossp (habitualmente ya disponible).

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. Tabla: especialidades (maestra compartida, sin RLS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS especialidades (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      VARCHAR(120) NOT NULL,
    codigo      VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE especialidades IS 'Catálogo de especialidades médicas (compartido entre tenants).';
COMMENT ON COLUMN especialidades.descripcion IS 'Descripción de la especialidad para referencia.';

-- Para bases ya creadas sin descripcion: añadir columna (PostgreSQL 11+)
ALTER TABLE especialidades ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- =============================================================================
-- 2. Tabla: especialistas (tenant principal; RLS activo)
-- =============================================================================
CREATE TABLE IF NOT EXISTS especialistas (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nombre         VARCHAR(120) NOT NULL,
    apellido       VARCHAR(120) NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE especialistas IS 'Usuarios del sistema; cada fila es un tenant. RLS por id.';

ALTER TABLE especialistas ENABLE ROW LEVEL SECURITY;

-- Política: un especialista solo puede ver y modificar su propia fila.
-- El backend debe conectar con un rol que use current_setting('app.especialista_id').
CREATE POLICY especialistas_isolate ON especialistas
    FOR ALL
    USING (id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (id = current_setting('app.especialista_id', true)::uuid);

-- Excepción: el registro (signup) debe poder INSERT sin tener aún app.especialista_id.
-- Se puede hacer con un rol de "service" que inserte, o permitir INSERT sin USING.
-- Opción: política SELECT/UPDATE/DELETE por tenant; INSERT permitido a rol backend sin RLS check.
-- Para que el primer INSERT funcione, el backend puede usar un rol con BYPASSRLS temporal
-- o una política que permita INSERT sin USING (solo WITH CHECK false para otros).
-- En producción típicamente: conexión con rol que siempre setea app.especialista_id
-- y para registro se usa una ruta que inserta y luego solo ese usuario verá su fila.
CREATE POLICY especialistas_insert ON especialistas
    FOR INSERT
    WITH CHECK (true);
-- Ajuste: si quieres que solo el propio usuario pueda insertar "su" fila después de creada,
-- la política de SELECT/UPDATE/DELETE ya lo garantiza. Para registro, el backend
-- inserta y no necesita leer por RLS en la misma transacción; opcional restringir INSERT
-- a que id = app.especialista_id cuando ya está autenticado (complejo). Dejamos INSERT libre
-- para que el endpoint de registro funcione; el backend no debe exponer listado de otros.

-- =============================================================================
-- 3. Tabla: especialista_especialidades (N:N); RLS por especialista_id
-- =============================================================================
CREATE TABLE IF NOT EXISTS especialista_especialidades (
    especialista_id  UUID NOT NULL REFERENCES especialistas(id) ON DELETE CASCADE,
    especialidad_id UUID NOT NULL REFERENCES especialidades(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (especialista_id, especialidad_id)
);

COMMENT ON TABLE especialista_especialidades IS 'Relación N:N entre especialistas y especialidades.';

ALTER TABLE especialista_especialidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY especialista_especialidades_tenant ON especialista_especialidades
    FOR ALL
    USING (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

-- INSERT para registro: permitir cuando el backend crea la relación para un nuevo usuario.
CREATE POLICY especialista_especialidades_insert ON especialista_especialidades
    FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- 4. Rol y uso de app.especialista_id
-- =============================================================================
-- El backend (FastAPI) debe, en cada request autenticado:
--   1. Validar JWT y extraer especialista_id (sub).
--   2. Antes de cualquier query: SET LOCAL app.especialista_id = '<uuid>';
-- Así las políticas RLS filtrarán automáticamente por ese tenant.
-- No crear un rol por especialista; un solo rol de aplicación con SET LOCAL es suficiente.

-- =============================================================================
-- 5. Trigger opcional: updated_at en especialistas
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS especialistas_updated_at ON especialistas;
CREATE TRIGGER especialistas_updated_at
    BEFORE UPDATE ON especialistas
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

-- Mismo trigger para especialidades si se actualizan por app
DROP TRIGGER IF EXISTS especialidades_updated_at ON especialidades;
CREATE TRIGGER especialidades_updated_at
    BEFORE UPDATE ON especialidades
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

-- =============================================================================
-- 6. Tabla: odontograma_hallazgos (catálogo para odontograma; sin RLS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS odontograma_hallazgos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(30) NOT NULL UNIQUE,
    nombre              VARCHAR(80) NOT NULL,
    categoria           VARCHAR(20) NOT NULL CHECK (categoria IN ('patologia', 'restauracion', 'estado')),
    descripcion_visual  VARCHAR(200),
    activo              BOOLEAN NOT NULL DEFAULT true,
    orden               SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE odontograma_hallazgos IS 'Catálogo de hallazgos para el odontograma: patologías, restauraciones y estado base.';
COMMENT ON COLUMN odontograma_hallazgos.categoria IS 'patologia = qué hay que arreglar; restauracion = lo ya realizado; estado = estado base (ej. sano).';
COMMENT ON COLUMN odontograma_hallazgos.descripcion_visual IS 'Sugerencia de representación visual en la UI (ej. Mancha roja, Línea quebrada).';
COMMENT ON COLUMN odontograma_hallazgos.orden IS 'Orden de aparición en listas/selectores.';

CREATE INDEX IF NOT EXISTS idx_odontograma_hallazgos_categoria ON odontograma_hallazgos (categoria);

DROP TRIGGER IF EXISTS odontograma_hallazgos_updated_at ON odontograma_hallazgos;
CREATE TRIGGER odontograma_hallazgos_updated_at
    BEFORE UPDATE ON odontograma_hallazgos
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

-- =============================================================================
-- 7. Datos iniciales: especialidades (escalable: odonto + salud básica)
-- =============================================================================
INSERT INTO especialidades (nombre, codigo, descripcion, activo) VALUES
    ('Odontología General', 'ODO_GEN', 'Prevención, diagnóstico y tratamiento primario.', true),
    ('Cirugía Maxilofacial', 'ODO_MAX', 'Cirugías complejas de cara y boca.', true),
    ('Endodoncia', 'ODO_END', 'Tratamientos de conducto y pulpa dental.', true),
    ('Ortodoncia', 'ODO_ORT', 'Corrección de posición de dientes y mandíbula.', true),
    ('Odontopediatría', 'ODO_PED', 'Salud dental en niños.', true),
    ('Periodoncia', 'ODO_PER', 'Tratamiento de encías y soporte óseo.', true),
    ('Medicina General', 'MED_GEN', 'Consulta médica primaria.', true),
    ('Enfermería', 'ENF_GEN', 'Servicios de cuidados y procedimientos menores.', true)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    updated_at = now();

-- =============================================================================
-- 8. Datos iniciales: odontograma_hallazgos (patologías, restauraciones, estado)
-- =============================================================================
INSERT INTO odontograma_hallazgos (codigo, nombre, categoria, descripcion_visual, orden) VALUES
    -- Estado base
    ('SANO', 'Sano', 'estado', 'Sin marcas (Estado base).', 0),
    -- Patologías (lo que hay que arreglar)
    ('CARIES', 'Caries', 'patologia', 'Mancha roja / Área sombreada.', 10),
    ('FRACTURA', 'Fractura', 'patologia', 'Línea quebrada sobre el diente.', 20),
    ('AUSENTE', 'Diente Ausente', 'patologia', 'Una "X" negra sobre el diente.', 30),
    ('EXODONCIA_IND', 'Exodoncia Indicada', 'patologia', 'Círculo rojo (diente para extraer).', 40),
    -- Restauraciones (lo que ya se hizo)
    ('RESINA_OBT', 'Resina / Obturación', 'restauracion', 'Área azul o verde sólido.', 50),
    ('CONDUCTO', 'Tratamiento de Conducto', 'restauracion', 'Línea vertical en la raíz.', 60),
    ('CORONA', 'Corona', 'restauracion', 'Círculo que rodea la corona del diente.', 70),
    ('IMPLANTE', 'Implante', 'restauracion', 'Icono de tornillo en la zona de la raíz.', 80)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    categoria = EXCLUDED.categoria,
    descripcion_visual = EXCLUDED.descripcion_visual,
    orden = EXCLUDED.orden,
    updated_at = now();
