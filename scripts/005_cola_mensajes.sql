-- Odonto-Focus | Fase 4: Cola de Mensajes (YCloud / WhatsApp)
-- Ejecutar sobre la base de datos: analytics
-- Requiere scripts 001–004 aplicados previamente.

SET search_path TO sys_clinical, sys_config, public;

-- =============================================================================
-- Tabla: cola_mensajes  (Regla de Oro 3.4)
-- Persistencia de mensajes WhatsApp pendientes de envío / enviados / fallidos.
-- RLS por especialista_id para mantener el aislamiento multi-tenant.
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_clinical.cola_mensajes (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,

    -- Tipo de mensaje: identifica la plantilla/lógica de envío
    tipo           VARCHAR(40) NOT NULL
                       CHECK (tipo IN (
                           'abono_confirmacion',
                           'recordatorio_cita',
                           'presupuesto_aprobado',
                           'cita_cancelada',
                           'personalizado'
                       )),

    -- Destinatario en formato internacional sin + (ej. 58414XXXXXXX)
    destino        VARCHAR(20) NOT NULL,

    -- Payload JSON con variables del mensaje
    -- abono_confirmacion  → {monto, saldo_pendiente, fecha, paciente_nombre}
    -- recordatorio_cita   → {fecha_hora, servicio_nombre, paciente_nombre, especialista_nombre}
    payload        JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Ciclo de vida del mensaje
    estado         VARCHAR(15) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente', 'enviado', 'leido', 'fallido', 'cancelado')),
    reintentos     SMALLINT     NOT NULL DEFAULT 0,
    max_reintentos SMALLINT     NOT NULL DEFAULT 3,
    ultimo_error   TEXT,

    -- Referencias opcionales para trazabilidad
    abono_id       UUID REFERENCES sys_clinical.abonos(id)    ON DELETE SET NULL,
    cita_id        UUID REFERENCES sys_clinical.citas(id)     ON DELETE SET NULL,

    -- Timestamps
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    enviado_at     TIMESTAMPTZ,
    leido_at       TIMESTAMPTZ,
    proximo_intento TIMESTAMPTZ DEFAULT now()   -- el worker respeta este campo para reintentos
);

COMMENT ON TABLE sys_clinical.cola_mensajes IS
    'Cola persistente de mensajes WhatsApp vía YCloud API (Regla de Oro 3.4). '
    'Un worker procesa las filas con estado=pendiente y reintentos < max_reintentos.';
COMMENT ON COLUMN sys_clinical.cola_mensajes.destino IS
    'Número en formato E.164 sin +. Ejemplo: 58414XXXXXXX para Venezuela.';
COMMENT ON COLUMN sys_clinical.cola_mensajes.payload IS
    'Variables del mensaje como JSON. Depende del campo tipo.';
COMMENT ON COLUMN sys_clinical.cola_mensajes.proximo_intento IS
    'El worker solo procesa filas donde proximo_intento <= now(). '
    'Al fallar se incrementa con backoff exponencial (1min, 2min, 4min…).';

-- RLS
ALTER TABLE sys_clinical.cola_mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY cola_mensajes_tenant ON sys_clinical.cola_mensajes
    FOR ALL
    USING   (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cola_especialista   ON sys_clinical.cola_mensajes (especialista_id);
CREATE INDEX IF NOT EXISTS idx_cola_estado_intento ON sys_clinical.cola_mensajes (estado, proximo_intento)
    WHERE estado IN ('pendiente', 'fallido');
CREATE INDEX IF NOT EXISTS idx_cola_tipo           ON sys_clinical.cola_mensajes (tipo);
CREATE INDEX IF NOT EXISTS idx_cola_abono          ON sys_clinical.cola_mensajes (abono_id) WHERE abono_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cola_cita           ON sys_clinical.cola_mensajes (cita_id)  WHERE cita_id IS NOT NULL;
