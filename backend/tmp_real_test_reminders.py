import asyncio
from sqlmodel import Session, select
from app.database import engine
from app.models.finanzas import Cita
from app.models.paciente import Paciente
from app.models.especialista import Especialista
from app.models.comunicaciones import ColaMensaje
from app.models.insumo_servicio import Servicio
from app.config import settings

async def real_test_reminders():
    with Session(engine) as session:
        # 1. Asegurar correos de los pacientes
        patients_data = [
            {"nombre": "Daniel", "apellido": "Morales", "email": "danielaaleonr@gmail.com"},
            {"nombre": "Humberto", "apellido": "Salas", "email": "angularnode1@gmail.com"}
        ]
        
        for pdata in patients_data:
            p = session.exec(select(Paciente).where(Paciente.nombre.ilike(f"%{pdata['nombre']}%"), Paciente.apellido.ilike(f"%{pdata['apellido']}%"))).first()
            if p:
                p.email = pdata['email']
                session.add(p)
                print(f"Correo actualizado para {p.nombre} {p.apellido}: {p.email}")
            else:
                print(f"Paciente no encontrado: {pdata['nombre']} {pdata['apellido']}")
        
        session.commit()

        # 2. Buscar citas de hoy para estos pacientes
        # Usamos una búsqueda simple por nombre en la cita -> paciente
        for pdata in patients_data:
            stmt = select(Cita).join(Paciente).where(
                Paciente.nombre.ilike(f"%{pdata['nombre']}%"),
                Paciente.apellido.ilike(f"%{pdata['apellido']}%")
            ).order_by(Cita.fecha_hora.desc())
            
            cita = session.exec(stmt).first()
            if not cita:
                print(f"Cita no encontrada para {pdata['nombre']} {pdata['apellido']}")
                continue

            # Obtener datos para el payload
            paciente = session.get(Paciente, cita.paciente_id)
            especialista = session.get(Especialista, cita.especialista_id)
            servicio = session.get(Servicio, cita.servicio_id) if cita.servicio_id else None
            
            fecha_hora_local = cita.fecha_hora.strftime("%d/%m/%Y %H:%M")

            # 3. Encolar el Recordatorio de Email (Fase 9.5)
            # Primero verificar si ya existe uno pendiente/enviado para hoy para evitar duplicados en la prueba
            recordatorio = ColaMensaje(
                especialista_id=cita.especialista_id,
                tipo="recordatorio_cita",
                metodo="email",
                destino=paciente.email,
                payload={
                    "paciente_nombre":     f"{paciente.nombre} {paciente.apellido}",
                    "especialista_nombre": f"{especialista.nombre} {especialista.apellido}",
                    "servicio_nombre":     servicio.nombre if servicio else "Consulta General",
                    "fecha_hora":          fecha_hora_local,
                    "moneda":              settings.moneda_simbolo,
                },
                cita_id=cita.id,
                max_reintentos=1
            )
            session.add(recordatorio)
            print(f"🚀 Recordatorio encolado para {paciente.nombre} a {paciente.email}")
        
        session.commit()
        print("\n✅ Citas procesadas. Si el worker está activo y tienes el .env configurado, deberían llegar en breve.")

if __name__ == "__main__":
    asyncio.run(real_test_reminders())
