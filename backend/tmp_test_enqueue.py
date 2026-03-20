import asyncio
from sqlmodel import Session, select
from app.database import engine
from app.models.comunicaciones import ColaMensaje
from app.models.especialista import Especialista
from app.models.paciente import Paciente

async def test_enqueue():
    with Session(engine) as session:
        # Buscar especialista y paciente reales
        especialista = session.exec(select(Especialista)).first()
        paciente = session.exec(select(Paciente)).first()

        if not especialista or not paciente:
            print("No hay especialistas o pacientes en el sistema.")
            return

        print(f"Probando con Especialista: {especialista.id}")
        print(f"Probando con Paciente: {paciente.nombre} {paciente.apellido} ({paciente.email or 'Sin email'})")

        # 1. Encola un Correo de prueba
        msg_email = ColaMensaje(
            especialista_id=especialista.id,
            tipo="personalizado",
            metodo="email",
            destino=paciente.email if paciente.email else "test@vitalnexus.com",
            payload={"mensaje": "Hola, esto es una prueba de integración básica de correo de VitalNexus. 🦷"},
            max_reintentos=1
        )
        session.add(msg_email)

        # 2. Encola un WhatsApp de prueba
        msg_wa = ColaMensaje(
            especialista_id=especialista.id,
            tipo="personalizado",
            metodo="whatsapp",
            destino=paciente.telefono.lstrip("+").replace(" ", "") if paciente.telefono else "584120000000",
            payload={"mensaje": "Hola! Esto es una prueba de VitalNexus por WhatsApp. 🦷"},
            max_reintentos=1
        )
        session.add(msg_wa)

        session.commit()
        print("✅ Mensajes de prueba encolados en la base de datos.")
        print("El worker los procesará en el siguiente ciclo (2 minutos) si start_scheduler() está activo.")

if __name__ == "__main__":
    asyncio.run(test_enqueue())
