-- Corregir política RLS de recipes para usar el mismo nombre de variable que el backend
DROP POLICY IF EXISTS recipes_especialista_policy ON sys_clinical.recipes;
CREATE POLICY recipes_especialista_policy 
    ON sys_clinical.recipes 
    FOR ALL 
    USING (
        especialista_id = current_setting('app.especialista_id', true)::uuid
    )
    WITH CHECK (
        especialista_id = current_setting('app.especialista_id', true)::uuid
    );
