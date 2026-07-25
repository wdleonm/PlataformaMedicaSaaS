import pytest
from uuid import uuid4

def test_register_especialista_success(client, session):
    from app.models.especialista import Especialista
    from sqlmodel import select
    email = f"doc_{uuid4().hex[:6]}@example.com"
    payload = {
        "email": email,
        "password": "password123.",
        "nombre": "Pedro",
        "apellido": "Gomez",
        "especialidad_ids": [],
        "turnstile_token": "mock-token"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["email"] == email
    assert res_data["nombre"] == "Pedro"
    assert res_data["activo"] is True
    
    # Validar en base de datos que la suscripción está activa y con plan
    stmt = select(Especialista).where(Especialista.email == email)
    db_esp = session.exec(stmt).first()
    assert db_esp is not None
    assert db_esp.suscripcion_activa is True
    assert db_esp.plan_suscripcion_id is not None


def test_register_especialista_duplicate(client, test_specialist):
    payload = {
        "email": test_specialist.email,
        "password": "newpassword123.",
        "nombre": "Pedro",
        "apellido": "Gomez",
        "especialidad_ids": [],
        "turnstile_token": "mock-token"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email ya registrado"

def test_login_success(client, test_specialist):
    payload = {
        "email": test_specialist.email,
        "password": "password123"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "access_token" in res_data
    assert res_data["especialista"]["email"] == test_specialist.email

def test_login_invalid_credentials(client, test_specialist):
    payload = {
        "email": test_specialist.email,
        "password": "wrong_password"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Email o contraseña incorrectos"

def test_get_me_success(client, specialist_headers, test_specialist):
    response = client.get("/api/auth/me", headers=specialist_headers)
    assert response.status_code == 200
    assert response.json()["email"] == test_specialist.email

def test_get_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    # TestClient/HTTPBearer details
    assert "detail" in response.json()

def test_update_profile(client, specialist_headers):
    payload = {
        "nombre": "Juan Carlos",
        "clinica_nombre": "Clinica Dental Premium"
    }
    response = client.patch("/api/auth/me", json=payload, headers=specialist_headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["nombre"] == "Juan Carlos"
    assert res_data["clinica_nombre"] == "Clinica Dental Premium"

def test_change_password_success(client, session, test_specialist, specialist_headers):
    payload = {
        "current_password": "password123",
        "new_password": "newpassword123."
    }
    response = client.post("/api/auth/change-password", json=payload, headers=specialist_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Contraseña actualizada exitosamente"
    
    # Verify login with new password works
    login_payload = {
        "email": test_specialist.email,
        "password": "newpassword123."
    }
    login_response = client.post("/api/auth/login", json=login_payload)
    assert login_response.status_code == 200

def test_change_password_invalid_current(client, specialist_headers):
    payload = {
        "current_password": "wrong_current_password",
        "new_password": "newpassword123."
    }
    response = client.post("/api/auth/change-password", json=payload, headers=specialist_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "La contraseña actual es incorrecta"

def test_update_security_settings(client, specialist_headers):
    payload = {
        "exigir_cambio_password": True,
        "intervalo_cambio_password": 90
    }
    response = client.patch("/api/auth/security-settings", json=payload, headers=specialist_headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["exigir_cambio_password"] is True
    assert res_data["intervalo_cambio_password"] == 90

def test_forced_password_change_redirection(client, session, test_specialist):
    from app.api.auth import create_access_token
    # Set the flag to force password change
    test_specialist.forzar_cambio_password_proximo_acceso = True
    session.add(test_specialist)
    session.commit()
    session.refresh(test_specialist)
    
    token = create_access_token(
        data={"sub": str(test_specialist.id), "email": test_specialist.email, "rol": "especialista"}
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    # Request to operational endpoint should fail with 403
    me_response = client.get("/api/pacientes", headers=headers)
    assert me_response.status_code == 403
    assert "Debes actualizar tu contraseña para continuar" in me_response.json()["detail"]
    
    # Request to change password should be allowed
    change_payload = {
        "current_password": "password123",
        "new_password": "anotherpassword123."
    }
    change_response = client.post("/api/auth/change-password", json=change_payload, headers=headers)
    assert change_response.status_code == 200
    assert change_response.json()["message"] == "Contraseña actualizada exitosamente"


def test_get_especialidades_filtered(client, session):
    from app.models.especialidad import Especialidad
    from app.models.hc_seccion import HCSeccion, EspecialidadHCSeccion
    
    # Create an active specialty without config
    esp_no_config = Especialidad(nombre="Sin Configurar", codigo="SIN_CONFIG", activo=True)
    # Create an active specialty with config
    esp_with_config = Especialidad(nombre="Con Configurar", codigo="CON_CONFIG", activo=True)
    # Create an inactive specialty with config
    esp_inactive = Especialidad(nombre="Inactiva", codigo="INACTIVA", activo=False)
    
    session.add(esp_no_config)
    session.add(esp_with_config)
    session.add(esp_inactive)
    session.commit()
    
    # Create an active section
    seccion = HCSeccion(nombre="Seccion Test", codigo="SEC_TEST", componente_frontend="test", activo=True)
    session.add(seccion)
    session.commit()
    
    # Associate active specialty with the active section
    assoc1 = EspecialidadHCSeccion(especialidad_id=esp_with_config.id, hc_seccion_id=seccion.id, orden=1, obligatoria=True)
    # Associate inactive specialty with the active section
    assoc2 = EspecialidadHCSeccion(especialidad_id=esp_inactive.id, hc_seccion_id=seccion.id, orden=1, obligatoria=True)
    
    session.add(assoc1)
    session.add(assoc2)
    session.commit()
    
    # Get request
    response = client.get("/api/auth/especialidades")
    assert response.status_code == 200
    data = response.json()
    
    # Extract codes
    codigos = [x["codigo"] for x in data]
    
    # CON_CONFIG should be in it, but SIN_CONFIG and INACTIVA should NOT
    assert "CON_CONFIG" in codigos
    assert "SIN_CONFIG" not in codigos
    assert "INACTIVA" not in codigos
