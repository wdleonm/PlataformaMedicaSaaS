"""
Script para resetear datos transaccionales y cargar ejemplos frescos para TODOS los especialistas.
Esto garantiza que cualquier usuario que inicie sesión en el entorno de desarrollo vea datos en su dashboard.
"""
from datetime import date, datetime, timedelta
from uuid import UUID
from sqlmodel import Session, select, text
from app.database import engine
from app.models.especialista import Especialista
from app.models.paciente import Paciente
from app.models.finanzas import Cita, Presupuesto, Abono
from app.models.historia_clinica import HistoriaClinica
from app.models.insumo_servicio import Insumo, Servicio

def reset_data_all():
    with Session(engine) as session:
        print("Iniciando purga global de datos transaccionales...")
        
        # 1. Limpiar tablas
        session.exec(text("TRUNCATE TABLE sys_clinical.abonos CASCADE"))
        session.exec(text("TRUNCATE TABLE sys_clinical.presupuesto_detalles CASCADE"))
        session.exec(text("TRUNCATE TABLE sys_clinical.presupuestos CASCADE"))
        session.exec(text("TRUNCATE TABLE sys_clinical.citas CASCADE"))
        session.exec(text("TRUNCATE TABLE sys_clinical.historias_clinicas CASCADE"))
        session.exec(text("TRUNCATE TABLE sys_clinical.pacientes CASCADE"))
        session.commit()
        print("Tablas purgadas.")

        # 2. Obtener lista de todos los especialistas
        especialistas = session.exec(select(Especialista)).all()
        if not especialistas:
            print("ERROR: No hay especialistas registrados en el sistema.")
            return

        for esp in especialistas:
            eid = esp.id
            print(f"Cargando ejemplos para: {esp.email} ({eid})")

            # 3. Pacientes
            p1 = Paciente(especialista_id=eid, nombre="Juan", apellido="Pérez", documento="P001", email=f"juan_{eid.hex[:4]}@test.com", activo=True)
            p2 = Paciente(especialista_id=eid, nombre="María", apellido="García", documento="P002", email=f"maria_{eid.hex[:4]}@test.com", activo=True)
            session.add(p1)
            session.add(p2)
            session.flush()

            # 4. Servicios (NUEVO: Para que aparezcan en el combo de la cita)
            s1 = Servicio(especialista_id=eid, nombre="Tratamiento de Conducto", codigo="CONS01", precio=450.0, activo=True)
            s2 = Servicio(especialista_id=eid, nombre="Limpieza Profunda", codigo="LIM01", precio=80.0, activo=True)
            s3 = Servicio(especialista_id=eid, nombre="Ortodoncia (Mensualidad)", codigo="ORT01", precio=150.0, activo=True)
            session.add(s1)
            session.add(s2)
            session.add(s3)
            session.flush()

            # 5. Insumos Críticos
            session.add(Insumo(especialista_id=eid, nombre="Guantes Látex", stock_actual=2, stock_minimo=10, costo_unitario=5.0))

            # 6. Presupuesto
            pres = Presupuesto(especialista_id=eid, paciente_id=p1.id, total=1500.0, saldo_pendiente=1300.0, estado="en_pago", notas="Tratamiento Dental Completo")
            session.add(pres)
            session.flush()

            # 7. Citas Hoy (VINCULADAS A SERVICIO Y PRESUPUESTO)
            hoy = datetime.now()
            c1 = Cita(
                especialista_id=eid, 
                paciente_id=p1.id, 
                servicio_id=s3.id, # Vinculado al servicio de Ortodoncia
                presupuesto_id=pres.id, # Vinculado al presupuesto
                fecha_hora=hoy.replace(hour=9, minute=0, second=0, microsecond=0), 
                duracion_min=30, 
                estado="programada", 
                notas="Primera fase tratamiento"
            )
            c2 = Cita(
                especialista_id=eid, 
                paciente_id=p2.id, 
                servicio_id=s1.id, # Vinculado a Conducto
                fecha_hora=hoy.replace(hour=11, minute=30, second=0, microsecond=0), 
                duracion_min=60, 
                estado="confirmada", 
                notas="Consulta inicial"
            )
            session.add(c1)
            session.add(c2)

        session.commit()
        print("=== RESET COMPLETO PARA TODOS LOS ESPECIALISTAS ===")

if __name__ == "__main__":
    reset_data_all()
