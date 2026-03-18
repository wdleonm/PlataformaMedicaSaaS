import sys
import os
from sqlalchemy import text

sys.path.append(os.path.abspath('backend'))
from app.database import engine

def main():
    print("Applying trigger and catch-up logic...")
    with engine.connect() as conn:
        # 1. Create Trigger Function and Trigger
        sql_trigger = """
        CREATE OR REPLACE FUNCTION sys_config.fn_seed_especialista_inventory()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM sys_config.servicios WHERE especialista_id = NEW.id AND codigo = 'S-0001') THEN
                INSERT INTO sys_config.servicios (especialista_id, nombre, codigo, precio, duracion_estimada_min)
                VALUES 
                    (NEW.id, 'Consulta de Primera Vez', 'S-0001', 0, 30),
                    (NEW.id, 'Consulta Sucesiva o Control', 'S-0002', 0, 20);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM sys_config.insumos WHERE especialista_id = NEW.id AND codigo = 'I-0001') THEN
                INSERT INTO sys_config.insumos (especialista_id, nombre, codigo, unidad, stock_actual, stock_minimo)
                VALUES 
                    (NEW.id, 'Guantes', 'I-0001', 'par', 0, 10),
                    (NEW.id, 'Tapa Bocas', 'I-0002', 'unidad', 0, 10);
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_seed_inventory ON sys_config.especialistas;
        CREATE TRIGGER trg_seed_inventory
        AFTER INSERT ON sys_config.especialistas
        FOR EACH ROW EXECUTE FUNCTION sys_config.fn_seed_especialista_inventory();
        """
        
        # 2. Catch-up logic for existing specialists
        sql_catchup = """
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN SELECT id FROM sys_config.especialistas LOOP
                -- Seed servicios
                IF NOT EXISTS (SELECT 1 FROM sys_config.servicios WHERE especialista_id = r.id AND codigo = 'S-0001') THEN
                    INSERT INTO sys_config.servicios (especialista_id, nombre, codigo, precio, duracion_estimada_min)
                    VALUES 
                        (r.id, 'Consulta de Primera Vez', 'S-0001', 0, 30),
                        (r.id, 'Consulta Sucesiva o Control', 'S-0002', 0, 20);
                END IF;

                -- Seed insumos
                IF NOT EXISTS (SELECT 1 FROM sys_config.insumos WHERE especialista_id = r.id AND codigo = 'I-0001') THEN
                    INSERT INTO sys_config.insumos (especialista_id, nombre, codigo, unidad, stock_actual, stock_minimo)
                    VALUES 
                        (r.id, 'Guantes', 'I-0001', 'par', 0, 10),
                        (r.id, 'Tapa Bocas', 'I-0002', 'unidad', 0, 10);
                END IF;
            END LOOP;
        END $$;
        """
        
        try:
            conn.execute(text(sql_trigger))
            conn.execute(text(sql_catchup))
            conn.commit()
            print("Trigger and Catch-up applied successfully.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
