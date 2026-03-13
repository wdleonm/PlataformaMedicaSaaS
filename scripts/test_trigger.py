from sqlmodel import Session, create_engine, text
engine = create_engine('postgresql://postgres:123456@localhost:5432/analytics')
with Session(engine) as session:
    session.execute(text('INSERT INTO sys_clinical.presupuesto_detalles (presupuesto_id, descripcion, cantidad, precio_unitario) VALUES (:pid, :desc, :cant, :prec)'), 
                    {'pid': '75eb41af-e2c9-4438-916f-93d2e974b783', 'desc': 'TEST_MANUAL', 'cant': 1.0, 'prec': 10.0})
    session.commit()
    res = session.execute(text("SELECT total FROM sys_clinical.presupuestos WHERE id = '75eb41af-e2c9-4438-916f-93d2e974b783'")).first()
    print(f"TOTAL TRAS INSERT SQL: {res[0]}")
