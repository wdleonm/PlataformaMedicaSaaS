-- Odonto-Focus | Fase 8.1 & 8.4: Especialidades y Roles Administrativos
-- Ejecutar sobre la base de datos
--

SET search_path TO sys_config, public;

-- =============================================================================
-- 1. Roles en Administradores
-- =============================================================================
ALTER TABLE sys_config.administradores 
    ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'master';

COMMENT ON COLUMN sys_config.administradores.rol IS 'Rol del administrador: master (acceso total), solo_lectura (auditoría).';

-- Asegurar que smartlift1608@gmail.com existe y es master
-- Nota: no conocemos su password_hash aquí, así que solo insertamos si no existe
INSERT INTO sys_config.administradores (email, password_hash, nombre, apellido, rol)
VALUES ('smartlift1608@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LqZGueOQ/RGxOF8B9gZ8S8D8T7p8Z8X8S8D8T', 'Usuario', 'Master', 'master')
ON CONFLICT (email) DO UPDATE SET rol = 'master';

-- =============================================================================
-- 2. Nuevas Especialidades y Estandarización
-- =============================================================================
-- Primero, si existe MEDICINA_GENERAL (el antiguo código largo), podemos renombrarlo o ignorarlo.
-- Dado que el usuario ya lo arregló manualmente, haremos el script compatible.

INSERT INTO sys_config.especialidades (id, nombre, codigo, descripcion, activo)
VALUES
    (uuid_generate_v4(), 'Medicina General', 'MED_GEN', 'Consulta de Medicina General', true),
    (uuid_generate_v4(), 'Medicina Interna', 'MED_INT', 'Consulta de Medicina Interna', true),
    (uuid_generate_v4(), 'Traumatología',    'MED_TRA', 'Consulta de Traumatología',     true),
    (uuid_generate_v4(), 'Ginecología',      'MED_GIN', 'Consulta de Ginecología',       true),
    (uuid_generate_v4(), 'Toxicología',      'MED_TOX', 'Consulta de Toxicología',       true),
    (uuid_generate_v4(), 'Pediatría',        'MED_PED', 'Consulta de Pediatría',         true)
ON CONFLICT (codigo) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- =============================================================================
-- 3. Mapeo de Secciones HC para nuevas especialidades
-- Se asignan las secciones básicas: CONSULTA, ANTECEDENTES, EXAMEN_FISICO, PLAN
-- =============================================================================
DO $$
DECLARE
    v_esp_id UUID;
    v_sec_consulta UUID;
    v_sec_antecedentes UUID;
    v_sec_examen UUID;
    v_sec_plan UUID;
    v_codigos_esp TEXT[] := ARRAY['MED_GEN', 'MED_INT', 'MED_TRA', 'MED_GIN', 'MED_TOX', 'MED_PED'];
    v_cod_esp TEXT;
BEGIN
    -- Obtener IDs de las secciones básicas
    SELECT id INTO v_sec_consulta      FROM sys_config.hc_secciones WHERE codigo = 'CONSULTA';
    SELECT id INTO v_sec_antecedentes  FROM sys_config.hc_secciones WHERE codigo = 'ANTECEDENTES';
    SELECT id INTO v_sec_examen        FROM sys_config.hc_secciones WHERE codigo = 'EXAMEN_FISICO';
    SELECT id INTO v_sec_plan          FROM sys_config.hc_secciones WHERE codigo = 'PLAN';

    -- Iterar sobre las nuevas especialidades
    FOREACH v_cod_esp IN ARRAY v_codigos_esp
    LOOP
        SELECT id INTO v_esp_id FROM sys_config.especialidades WHERE codigo = v_cod_esp;
        
        IF v_esp_id IS NOT NULL THEN
            -- Insertar relaciones
            INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria)
            VALUES 
                (v_esp_id, v_sec_consulta,     1, true),
                (v_esp_id, v_sec_antecedentes, 2, false),
                (v_esp_id, v_sec_examen,       3, false),
                (v_esp_id, v_sec_plan,         4, false)
            ON CONFLICT (especialidad_id, hc_seccion_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;
