-- Script CORREGIDO para asociar especialidades dentales con sus secciones obligatorias
-- Garantiza que las 4 especialidades (ODO_GEN, ODO_MAX, ODO_END, ODO_ORT) tengan las 6 secciones
-- Todas las secciones (incluyendo ACTIVIDADES) se marcan como OBLIGATORIAS.

DO $$
DECLARE
    dental_specialties TEXT[] := ARRAY['ODO_GEN', 'ODO_MAX', 'ODO_END', 'ODO_ORT'];
    -- Códigos exactos de las secciones de HC
    dental_sections TEXT[] := ARRAY['CONSULTA', 'ANTECEDENTES', 'EXAMEN_FISICO', 'ODONTOGRAMA', 'PLAN', 'ACTIVIDADES'];
    spec_code TEXT;
    sect_code TEXT;
    v_spec_id UUID;
    v_sect_id UUID;
    v_orden INT;
BEGIN
    -- Recorrer cada especialidad dental
    FOREACH spec_code IN ARRAY dental_specialties
    LOOP
        -- Obtener ID de la especialidad
        SELECT id INTO v_spec_id FROM sys_config.especialidades WHERE codigo = spec_code;
        
        IF v_spec_id IS NOT NULL THEN
            v_orden := 1;
            -- Recorrer cada sección dental
            FOREACH sect_code IN ARRAY dental_sections
            LOOP
                -- Obtener ID de la sección
                SELECT id INTO v_sect_id FROM sys_config.hc_secciones WHERE codigo = sect_code;
                
                IF v_sect_id IS NOT NULL THEN
                    -- Insertar relación si no existe o actualizar para que sea OBLIGATORIA
                    INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria)
                    VALUES (v_spec_id, v_sect_id, v_orden, TRUE)
                    ON CONFLICT (especialidad_id, hc_seccion_id) DO UPDATE 
                    SET orden = EXCLUDED.orden, 
                        obligatoria = TRUE; -- Forzar obligatoriedad
                    
                    v_orden := v_orden + 1;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END $$;
