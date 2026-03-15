from app.database import init_db
from app.models.historia_clinica import HistoriaClinica, HistoriaClinicaAdjunto
from app.models.paciente import Paciente
from app.models.especialista import Especialista

if __name__ == "__main__":
    print("Iniciando creación de tablas...")
    init_db()
    print("Tablas creadas/verificadas exitosamente.")
