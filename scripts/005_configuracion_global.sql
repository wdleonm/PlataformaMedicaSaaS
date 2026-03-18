-- Odonto-Focus | Fase 8.3: Configuración Global y Tasas BCV
-- Ejecutar en sys_config

SET search_path TO sys_config, public;

CREATE TABLE IF NOT EXISTS sys_config.configuracion_global (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moneda_nombre               VARCHAR(50) NOT NULL DEFAULT 'Bolívar',
    moneda_simbolo              VARCHAR(10) NOT NULL DEFAULT 'Bs.',
    tasa_usd                    NUMERIC(15,4) NOT NULL DEFAULT 1.0,
    tasa_eur                    NUMERIC(15,4) NOT NULL DEFAULT 1.0,
    iva_porcentaje              NUMERIC(5,2) NOT NULL DEFAULT 16.0,
    bcv_modo_automatico         BOOLEAN NOT NULL DEFAULT true,
    bcv_ultima_sincronizacion   TIMESTAMPTZ,
    ycloud_api_key              TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar fila única si no existe
INSERT INTO sys_config.configuracion_global (id)
SELECT uuid_generate_v4()
WHERE NOT EXISTS (SELECT 1 FROM sys_config.configuracion_global);

CREATE TRIGGER configuracion_global_updated_at
    BEFORE UPDATE ON sys_config.configuracion_global
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();
