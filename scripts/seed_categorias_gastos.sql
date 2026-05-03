-- Insertar categorías por defecto para gastos fijos
-- Estas categorías tienen especialista_id = NULL (globales)

INSERT INTO sys_clinical.categorias_gastos (id, nombre, descripcion, created_at)
VALUES 
    (gen_random_uuid(), 'Alquiler de Local', 'Costo mensual del consultorio físico', NOW()),
    (gen_random_uuid(), 'Alquiler de Silla', 'Pago por uso de espacio en clínica de terceros', NOW()),
    (gen_random_uuid(), 'Secretaría/Sueldos', 'Pago de nómina a personal administrativo o asistente', NOW()),
    (gen_random_uuid(), 'Electricidad', 'Servicio eléctrico mensual', NOW()),
    (gen_random_uuid(), 'Agua', 'Servicio de agua potable mensual', NOW()),
    (gen_random_uuid(), 'Teléfono/Móvil', 'Servicio de telefonía fija o celular corporativo', NOW()),
    (gen_random_uuid(), 'Internet', 'Servicio de conexión a internet', NOW()),
    (gen_random_uuid(), 'Publicidad/Marketing', 'Gastos en redes sociales, folletos o anuncios', NOW()),
    (gen_random_uuid(), 'Limpieza', 'Insumos de limpieza o personal de aseo', NOW()),
    (gen_random_uuid(), 'Seguros', 'Seguros de responsabilidad civil o del local', NOW()),
    (gen_random_uuid(), 'Impuestos', 'Pagos de tasas municipales o impuestos nacionales', NOW()),
    (gen_random_uuid(), 'Otros', 'Gastos fijos no categorizados', NOW())
ON CONFLICT (id) DO NOTHING;
