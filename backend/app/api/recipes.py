from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.api.dependencies import get_current_especialista
from app.models.recipe import Recipe, RecipeCreate, RecipeRead, RecipeUpdate

router = APIRouter()


@router.post("", response_model=RecipeRead, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_in: RecipeCreate,
    session: Session = Depends(get_session),
    current_specialist=Depends(get_current_especialista),
):
    """Crea un nuevo récipe médico."""
    recipe = Recipe(
        paciente_id=recipe_in.paciente_id,
        historia_clinica_id=recipe_in.historia_clinica_id,
        medicamentos=recipe_in.medicamentos,
        indicaciones=recipe_in.indicaciones,
        notas_adicionales=recipe_in.notas_adicionales,
        especialista_id=current_specialist.id,
    )
    session.add(recipe)
    try:
        session.commit()
        session.refresh(recipe)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error al guardar el récipe: {str(e)}")

    return recipe


@router.get("/paciente/{paciente_id}", response_model=List[RecipeRead])
def read_recipes_by_paciente(
    paciente_id: UUID,
    session: Session = Depends(get_session),
    current_specialist=Depends(get_current_especialista),
):
    recipes = session.exec(
        select(Recipe)
        .where(Recipe.paciente_id == paciente_id)
        .where(Recipe.especialista_id == current_specialist.id)
        .order_by(Recipe.fecha_emision.desc())
    ).all()
    return recipes


@router.get("/public/{qr_token}", response_model=RecipeRead)
def verify_recipe(
    qr_token: str,
    session: Session = Depends(get_session),
):
    recipe = session.exec(select(Recipe).where(Recipe.qr_token == qr_token)).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Récipe no encontrado o QR inválido")
    if not recipe.activo:
        raise HTTPException(status_code=400, detail="Récipe inactivo")
    return recipe


@router.get("/{recipe_id}", response_model=RecipeRead)
def read_recipe(
    recipe_id: UUID,
    session: Session = Depends(get_session),
    current_specialist=Depends(get_current_especialista),
):
    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Récipe no encontrado")
    if recipe.especialista_id != current_specialist.id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    return recipe


@router.patch("/{recipe_id}", response_model=RecipeRead)
def update_recipe(
    recipe_id: UUID,
    recipe_in: RecipeUpdate,
    session: Session = Depends(get_session),
    current_specialist=Depends(get_current_especialista),
):
    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Récipe no encontrado")
    if recipe.especialista_id != current_specialist.id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    update_data = recipe_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(recipe, key, value)
    
    from datetime import datetime, timezone
    recipe.updated_at = datetime.now(timezone.utc)
    
    session.add(recipe)
    session.commit()
    session.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}")
def delete_recipe(
    recipe_id: UUID,
    session: Session = Depends(get_session),
    current_specialist=Depends(get_current_especialista),
):
    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Récipe no encontrado")
    if recipe.especialista_id != current_specialist.id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    recipe.activo = False
    session.add(recipe)
    session.commit()
    return {"ok": True}
