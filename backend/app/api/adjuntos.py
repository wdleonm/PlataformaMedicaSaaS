import os
import shutil
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.database import get_session
from app.models.historia_clinica import HistoriaClinica, HistoriaClinicaAdjunto
from app.models.especialista import Especialista
from app.api.dependencies import get_current_especialista

router = APIRouter(prefix="/api/adjuntos", tags=["Adjuntos"])

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/historia/{historia_id}", status_code=status.HTTP_201_CREATED)
async def subir_adjunto(
    historia_id: UUID,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: Especialista = Depends(get_current_especialista),
):
    """
    Sube un archivo y lo asocia a una historia clínica.
    """
    # Verificar que la historia existe
    historia = session.get(HistoriaClinica, historia_id)
    if not historia:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")

    # Generar nombre único para el archivo
    ext = os.path.splitext(file.filename)[1]
    nombre_unico = f"{uuid4()}{ext}"
    ruta_relativa = os.path.join(UPLOAD_DIR, nombre_unico)
    ruta_absoluta = os.path.abspath(ruta_relativa)

    try:
        with open(ruta_absoluta, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar el archivo: {str(e)}")

    # Crear registro en base de datos
    adjunto = HistoriaClinicaAdjunto(
        historia_id=historia_id,
        nombre_archivo=file.filename,
        ruta_archivo=ruta_relativa,
        tipo_mime=file.content_type,
        tamano=0, # Podríamos calcularlo pero por ahora 0
    )
    
    session.add(adjunto)
    session.commit()
    session.refresh(adjunto)
    
    return adjunto

@router.get("/historia/{historia_id}", response_model=List[HistoriaClinicaAdjunto])
def listar_adjuntos(
    historia_id: UUID,
    session: Session = Depends(get_session),
    current_user: Especialista = Depends(get_current_especialista),
):
    """
    Lista todos los adjuntos de una historia clínica.
    """
    statement = select(HistoriaClinicaAdjunto).where(HistoriaClinicaAdjunto.historia_id == historia_id)
    return session.exec(statement).all()

@router.get("/{adjunto_id}/download")
def descargar_adjunto(
    adjunto_id: UUID,
    download: bool = False,
    session: Session = Depends(get_session),
    current_user: Especialista = Depends(get_current_especialista),
):
    """
    Descarga o sirve el archivo adjunto. 
    Usa download=true para forzar la descarga, 
    de lo contrario intenta mostrarlo inline (en el navegador).
    """
    adjunto = session.get(HistoriaClinicaAdjunto, adjunto_id)
    if not adjunto:
        raise HTTPException(status_code=404, detail="Adjunto no encontrado")
    
    ruta_absoluta = os.path.abspath(adjunto.ruta_archivo)
    if not os.path.exists(ruta_absoluta):
        raise HTTPException(status_code=404, detail="El archivo físico no existe")
        
    return FileResponse(
        path=ruta_absoluta,
        filename=adjunto.nombre_archivo,
        media_type=adjunto.tipo_mime,
        content_disposition_type="attachment" if download else "inline"
    )

@router.delete("/{adjunto_id}")
def eliminar_adjunto(
    adjunto_id: UUID,
    session: Session = Depends(get_session),
    current_user: Especialista = Depends(get_current_especialista),
):
    """
    Elimina el registro y el archivo físico del adjunto.
    """
    adjunto = session.get(HistoriaClinicaAdjunto, adjunto_id)
    if not adjunto:
        raise HTTPException(status_code=404, detail="Adjunto no encontrado")
    
    # Eliminar archivo físico
    if os.path.exists(adjunto.ruta_archivo):
        os.remove(adjunto.ruta_archivo)
    
    session.delete(adjunto)
    session.commit()
    
    return {"detail": "Adjunto eliminado correctamente"}
