-- Odonto-Focus | Reset de Datos Transaccionales
-- Este script limpia TODA la información de pacientes, citas, historias y finanzas.
-- Use con precaución: Solo para limpieza de entorno de pruebas o inicio de producción.

BEGIN;

-- Desactivar triggers temporalmente si fuera necesario (opcional)
-- SET session_replication_role = 'replica';

TRUNCATE TABLE 
    sys_clinical.abonos,
    sys_clinical.presupuesto_detalles,
    sys_clinical.presupuestos,
    sys_clinical.citas,
    sys_clinical.odontograma_registros,
    sys_clinical.historias_clinicas_adjuntos,
    sys_clinical.historias_clinicas,
    sys_clinical.pacientes,
    sys_clinical.cola_mensajes 
RESTART IDENTITY CASCADE;

-- Restaurar triggers
-- SET session_replication_role = 'origin';

COMMIT;

-- Mensaje de confirmación (Psql)
-- \echo 'Limpieza de sys_clinical completada exitosamente.'
