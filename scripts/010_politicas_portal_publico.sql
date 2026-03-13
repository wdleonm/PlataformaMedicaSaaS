-- Odonto-Focus | Ajuste de Políticas RLS para Portal Público
SET search_path TO sys_config, sys_clinical, public;

-- 1. Permitir que cualquiera vea especialistas que tengan portal_visible = true
CREATE POLICY especialistas_public_select ON sys_config.especialistas
    FOR SELECT
    USING (portal_visible = true);

-- 2. Permitir ver servicios de especialistas con portal visible y que el servicio sea visible_publico
CREATE POLICY servicios_public_select ON sys_config.servicios
    FOR SELECT
    USING (
        visible_publico = true 
        AND EXISTS (
            SELECT 1 FROM sys_config.especialistas e 
            WHERE e.id = sys_config.servicios.especialista_id 
            AND e.portal_visible = true
        )
    );

-- 3. Permitir inserción de pacientes desde el portal público
-- (Necesitaremos que el backend asigne el especialista_id correcto)
CREATE POLICY pacientes_public_insert ON sys_clinical.pacientes
    FOR INSERT
    WITH CHECK (origen_registro = 'portal_publico');

-- 4. Permitir inserción de citas desde el portal público
CREATE POLICY citas_public_insert ON sys_clinical.citas
    FOR INSERT
    WITH CHECK (true); -- La validación de negocio se hace en el backend
