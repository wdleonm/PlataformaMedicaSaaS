-- Odonto-Focus | Trigger para Inventario Base (Servicios/Insumos)
-- Asegura que todo nuevo especialista nazca con datos útiles.

CREATE OR REPLACE FUNCTION sys_config.fn_seed_especialista_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Insertar Servicios Base (S-0001, S-0002)
    -- Evitamos duplicar si ya existen por alguna razón
    IF NOT EXISTS (SELECT 1 FROM sys_config.servicios WHERE especialista_id = NEW.id AND codigo = 'S-0001') THEN
        INSERT INTO sys_config.servicios (especialista_id, nombre, codigo, precio, duracion_estimada_min)
        VALUES 
            (NEW.id, 'Consulta de Primera Vez', 'S-0001', 0, 30),
            (NEW.id, 'Consulta Sucesiva o Control', 'S-0002', 0, 20);
    END IF;

    -- 2. Insertar Insumos Base (I-0001, I-0002)
    IF NOT EXISTS (SELECT 1 FROM sys_config.insumos WHERE especialista_id = NEW.id AND codigo = 'I-0001') THEN
        INSERT INTO sys_config.insumos (especialista_id, nombre, codigo, unidad, stock_actual, stock_minimo)
        VALUES 
            (NEW.id, 'Guantes', 'I-0001', 'par', 0, 10),
            (NEW.id, 'Tapa Bocas', 'I-0002', 'unidad', 0, 10);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vincular Trigger
DROP TRIGGER IF EXISTS trg_seed_inventory ON sys_config.especialistas;
CREATE TRIGGER trg_seed_inventory
AFTER INSERT ON sys_config.especialistas
FOR EACH ROW EXECUTE FUNCTION sys_config.fn_seed_especialista_inventory();
