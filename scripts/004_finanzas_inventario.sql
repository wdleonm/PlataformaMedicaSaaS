-- Odonto-Focus | Fase 3: Finanzas e Inventario
-- Ejecutar sobre la base de datos: analytics
-- Requiere scripts 001, 002 y 003 aplicados previamente.
--
-- Esquemas usados:
--   sys_config  → tablas maestras (insumos, servicios, servicio_insumos)
--   sys_clinical → tablas transaccionales (citas, presupuestos, presupuesto_detalles, abonos)

SET search_path TO sys_clinical, sys_config, public;

-- =============================================================================
-- 3.1  Tabla: insumos  (maestra por tenant → sys_config)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.insumos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,
    nombre          VARCHAR(150) NOT NULL,
    codigo          VARCHAR(40),
    unidad          VARCHAR(30) NOT NULL DEFAULT 'unidad',   -- unidad, ml, mg, rollo, etc.
    costo_unitario  NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
    stock_actual    NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo    NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    activo          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_config.insumos IS
    'Inventario de insumos/materiales por especialista (tenant). '
    'costo_unitario se usa para calcular la rentabilidad de servicios (Regla de Oro 3.2).';

ALTER TABLE sys_config.insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY insumos_tenant ON sys_config.insumos
    FOR ALL
    USING   (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

CREATE INDEX IF NOT EXISTS idx_insumos_especialista ON sys_config.insumos (especialista_id);
CREATE INDEX IF NOT EXISTS idx_insumos_nombre       ON sys_config.insumos (especialista_id, nombre);
CREATE INDEX IF NOT EXISTS idx_insumos_stock_bajo   ON sys_config.insumos (especialista_id)
    WHERE stock_actual <= stock_minimo AND activo = true;

DROP TRIGGER IF EXISTS insumos_updated_at ON sys_config.insumos;
CREATE TRIGGER insumos_updated_at
    BEFORE UPDATE ON sys_config.insumos
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

-- =============================================================================
-- 3.2a Tabla: servicios  (maestra por tenant → sys_config)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.servicios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,
    nombre          VARCHAR(150) NOT NULL,
    codigo          VARCHAR(40),
    precio          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
    activo          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_config.servicios IS
    'Catálogo de servicios ofrecidos por el especialista. '
    'El precio es la tarifa cobrada al paciente. El costo se calcula vía servicio_insumos.';

ALTER TABLE sys_config.servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY servicios_tenant ON sys_config.servicios
    FOR ALL
    USING   (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

CREATE INDEX IF NOT EXISTS idx_servicios_especialista ON sys_config.servicios (especialista_id);

DROP TRIGGER IF EXISTS servicios_updated_at ON sys_config.servicios;
CREATE TRIGGER servicios_updated_at
    BEFORE UPDATE ON sys_config.servicios
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

-- =============================================================================
-- 3.2b Tabla: servicio_insumos  ("receta" — Regla de Oro 3.2)
-- Costo_servicio = Σ (cantidad_utilizada × insumo.costo_unitario)
-- Utilidad_Neta  = monto_cobrado - Costo_servicio
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.servicio_insumos (
    servicio_id        UUID NOT NULL REFERENCES sys_config.servicios(id) ON DELETE CASCADE,
    insumo_id          UUID NOT NULL REFERENCES sys_config.insumos(id)   ON DELETE RESTRICT,
    cantidad_utilizada NUMERIC(12,4) NOT NULL DEFAULT 1 CHECK (cantidad_utilizada > 0),
    PRIMARY KEY (servicio_id, insumo_id)
);

COMMENT ON TABLE sys_config.servicio_insumos IS
    'Receta de insumos por servicio. Permite calcular el costo de materiales y la utilidad neta.';

CREATE INDEX IF NOT EXISTS idx_serv_insumos_servicio ON sys_config.servicio_insumos (servicio_id);
CREATE INDEX IF NOT EXISTS idx_serv_insumos_insumo   ON sys_config.servicio_insumos (insumo_id);

-- Vista de rentabilidad por servicio (útil para reportes)
CREATE OR REPLACE VIEW sys_config.v_rentabilidad_servicios AS
SELECT
    s.id              AS servicio_id,
    s.especialista_id,
    s.nombre          AS servicio_nombre,
    s.precio          AS precio_cobrado,
    COALESCE(SUM(si.cantidad_utilizada * i.costo_unitario), 0) AS costo_insumos,
    s.precio - COALESCE(SUM(si.cantidad_utilizada * i.costo_unitario), 0) AS utilidad_neta
FROM sys_config.servicios s
LEFT JOIN sys_config.servicio_insumos si ON si.servicio_id = s.id
LEFT JOIN sys_config.insumos i          ON i.id = si.insumo_id
WHERE s.activo = true
GROUP BY s.id, s.especialista_id, s.nombre, s.precio;

COMMENT ON VIEW sys_config.v_rentabilidad_servicios IS
    'Rentabilidad estimada por servicio: Utilidad_Neta = precio - Σ(cantidad × costo_unitario insumo).';

-- =============================================================================
-- 3.3  Tabla: citas  (transaccional → sys_clinical)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_clinical.citas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,
    paciente_id     UUID NOT NULL REFERENCES sys_clinical.pacientes(id)   ON DELETE CASCADE,
    servicio_id     UUID             REFERENCES sys_config.servicios(id)  ON DELETE SET NULL,
    fecha_hora      TIMESTAMPTZ NOT NULL,
    duracion_min    SMALLINT CHECK (duracion_min > 0),          -- duración estimada en minutos
    estado          VARCHAR(20) NOT NULL DEFAULT 'programada'
                        CHECK (estado IN ('programada','confirmada','en_curso','completada','cancelada','no_asistio')),
    monto_cobrado   NUMERIC(12,2) CHECK (monto_cobrado >= 0),   -- puede diferir del precio de lista
    costo_insumos   NUMERIC(12,2) CHECK (costo_insumos >= 0),   -- calculado al completar la cita
    utilidad_neta   NUMERIC(12,2),                              -- monto_cobrado - costo_insumos
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_clinical.citas IS
    'Agenda de citas/consultas. Al completar una cita se registran monto_cobrado, costo_insumos '
    'y utilidad_neta para trazabilidad de rentabilidad (Regla de Oro 3.2).';
COMMENT ON COLUMN sys_clinical.citas.estado IS
    'programada→confirmada→en_curso→completada | cancelada | no_asistio';

ALTER TABLE sys_clinical.citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY citas_tenant ON sys_clinical.citas
    FOR ALL
    USING   (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

CREATE INDEX IF NOT EXISTS idx_citas_especialista  ON sys_clinical.citas (especialista_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente      ON sys_clinical.citas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha         ON sys_clinical.citas (especialista_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_estado        ON sys_clinical.citas (especialista_id, estado);

DROP TRIGGER IF EXISTS citas_updated_at ON sys_clinical.citas;
CREATE TRIGGER citas_updated_at
    BEFORE UPDATE ON sys_clinical.citas
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

-- =============================================================================
-- 3.4a Tabla: presupuestos  (Regla de Oro 3.3)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_clinical.presupuestos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,
    paciente_id     UUID NOT NULL REFERENCES sys_clinical.pacientes(id)   ON DELETE CASCADE,
    fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
    total           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    saldo_pendiente NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (saldo_pendiente >= 0),
    estado          VARCHAR(20) NOT NULL DEFAULT 'borrador'
                        CHECK (estado IN ('borrador','aprobado','en_pago','pagado','cancelado')),
    validez_fecha   DATE,
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_clinical.presupuestos IS
    'Presupuesto de tratamiento. saldo_pendiente se actualiza automáticamente vía trigger '
    'al insertar/modificar abonos (Regla de Oro 3.3).';

ALTER TABLE sys_clinical.presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY presupuestos_tenant ON sys_clinical.presupuestos
    FOR ALL
    USING   (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

CREATE INDEX IF NOT EXISTS idx_presupuestos_especialista ON sys_clinical.presupuestos (especialista_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_paciente     ON sys_clinical.presupuestos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado       ON sys_clinical.presupuestos (especialista_id, estado);

DROP TRIGGER IF EXISTS presupuestos_updated_at ON sys_clinical.presupuestos;
CREATE TRIGGER presupuestos_updated_at
    BEFORE UPDATE ON sys_clinical.presupuestos
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

-- =============================================================================
-- 3.4b Tabla: presupuesto_detalles
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_clinical.presupuesto_detalles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presupuesto_id  UUID NOT NULL REFERENCES sys_clinical.presupuestos(id) ON DELETE CASCADE,
    servicio_id     UUID             REFERENCES sys_config.servicios(id)   ON DELETE SET NULL,
    descripcion     VARCHAR(200),           -- descripción libre si no se vincula a servicio
    cantidad        NUMERIC(8,2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
    subtotal        NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

COMMENT ON TABLE sys_clinical.presupuesto_detalles IS
    'Líneas del presupuesto. subtotal es calculado automáticamente por la BD.';

CREATE INDEX IF NOT EXISTS idx_presup_det_presupuesto ON sys_clinical.presupuesto_detalles (presupuesto_id);

-- =============================================================================
-- 3.4c Tabla: abonos  (Regla de Oro 3.3)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_clinical.abonos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id UUID NOT NULL REFERENCES sys_config.especialistas(id)    ON DELETE CASCADE,
    presupuesto_id  UUID NOT NULL REFERENCES sys_clinical.presupuestos(id)   ON DELETE CASCADE,
    monto           NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    fecha_abono     DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago     VARCHAR(30) NOT NULL DEFAULT 'efectivo'
                        CHECK (metodo_pago IN ('efectivo','transferencia','tarjeta_debito',
                                               'tarjeta_credito','cheque','otro')),
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_clinical.abonos IS
    'Pagos parciales o totales de un presupuesto. '
    'Cada INSERT dispara el trigger que actualiza presupuestos.saldo_pendiente.';

ALTER TABLE sys_clinical.abonos ENABLE ROW LEVEL SECURITY;

CREATE POLICY abonos_tenant ON sys_clinical.abonos
    FOR ALL
    USING   (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

CREATE INDEX IF NOT EXISTS idx_abonos_especialista  ON sys_clinical.abonos (especialista_id);
CREATE INDEX IF NOT EXISTS idx_abonos_presupuesto   ON sys_clinical.abonos (presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_abonos_fecha         ON sys_clinical.abonos (fecha_abono DESC);

-- =============================================================================
-- 3.4d Trigger: recalcular saldo_pendiente al insertar/actualizar/eliminar abono
-- Regla de Oro 3.3: saldo_pendiente = total - SUM(abonos.monto)
-- =============================================================================
CREATE OR REPLACE FUNCTION sys_clinical.recalcular_saldo_pendiente()
RETURNS TRIGGER AS $$
DECLARE
    v_presupuesto_id UUID;
    v_total          NUMERIC(12,2);
    v_abonado        NUMERIC(12,2);
    v_nuevo_saldo    NUMERIC(12,2);
    v_nuevo_estado   VARCHAR(20);
BEGIN
    -- Determinar qué presupuesto afecta
    IF TG_OP = 'DELETE' THEN
        v_presupuesto_id := OLD.presupuesto_id;
    ELSE
        v_presupuesto_id := NEW.presupuesto_id;
    END IF;

    -- Leer total del presupuesto
    SELECT total INTO v_total
    FROM sys_clinical.presupuestos
    WHERE id = v_presupuesto_id;

    -- Sumar todos los abonos vigentes
    SELECT COALESCE(SUM(monto), 0) INTO v_abonado
    FROM sys_clinical.abonos
    WHERE presupuesto_id = v_presupuesto_id;

    v_nuevo_saldo := GREATEST(v_total - v_abonado, 0);

    -- Actualizar estado según saldo
    IF v_nuevo_saldo = 0 THEN
        v_nuevo_estado := 'pagado';
    ELSIF v_abonado > 0 THEN
        v_nuevo_estado := 'en_pago';
    ELSE
        v_nuevo_estado := 'aprobado';    -- vuelve a aprobado si se revierte el último abono
    END IF;

    UPDATE sys_clinical.presupuestos
    SET saldo_pendiente = v_nuevo_saldo,
        estado          = CASE
                            WHEN estado IN ('borrador','cancelado') THEN estado   -- no cambiar si está borrador o cancelado
                            ELSE v_nuevo_estado
                          END,
        updated_at      = now()
    WHERE id = v_presupuesto_id;

    RETURN NULL;   -- AFTER trigger, valor de retorno ignorado
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS abonos_recalcular_saldo ON sys_clinical.abonos;
CREATE TRIGGER abonos_recalcular_saldo
    AFTER INSERT OR UPDATE OR DELETE ON sys_clinical.abonos
    FOR EACH ROW EXECUTE PROCEDURE sys_clinical.recalcular_saldo_pendiente();

-- =============================================================================
-- 3.4e Trigger: recalcular total del presupuesto al insertar/modificar detalles
-- total = SUM(subtotal de todos los detalles del presupuesto)
-- =============================================================================
CREATE OR REPLACE FUNCTION sys_clinical.recalcular_total_presupuesto()
RETURNS TRIGGER AS $$
DECLARE
    v_presupuesto_id UUID;
    v_nuevo_total    NUMERIC(12,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_presupuesto_id := OLD.presupuesto_id;
    ELSE
        v_presupuesto_id := NEW.presupuesto_id;
    END IF;

    SELECT COALESCE(SUM(subtotal), 0) INTO v_nuevo_total
    FROM sys_clinical.presupuesto_detalles
    WHERE presupuesto_id = v_presupuesto_id;

    -- Actualizar total y recalcular saldo_pendiente en consecuencia
    UPDATE sys_clinical.presupuestos
    SET total           = v_nuevo_total,
        saldo_pendiente = GREATEST(v_nuevo_total - (
                            SELECT COALESCE(SUM(monto), 0)
                            FROM sys_clinical.abonos
                            WHERE presupuesto_id = v_presupuesto_id
                          ), 0),
        updated_at      = now()
    WHERE id = v_presupuesto_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS detalles_recalcular_total ON sys_clinical.presupuesto_detalles;
CREATE TRIGGER detalles_recalcular_total
    AFTER INSERT OR UPDATE OR DELETE ON sys_clinical.presupuesto_detalles
    FOR EACH ROW EXECUTE PROCEDURE sys_clinical.recalcular_total_presupuesto();
