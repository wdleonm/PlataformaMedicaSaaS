import pytest
from uuid import uuid4

def test_create_paciente_success(client, specialist_headers):
    payload = {
        "nombre": "Maria",
        "apellido": "Gomez",
        "documento": f"V-{uuid4().hex[:8]}",
        "telefono": "04141234567",
        "email": "maria@gmail.com",
        "fecha_nacimiento": "1995-05-15",
        "activo": True
    }
    response = client.post("/api/pacientes", json=payload, headers=specialist_headers)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["nombre"] == "Maria"
    assert "id" in res_data

def test_create_paciente_duplicate_doc(client, specialist_headers):
    doc = f"V-{uuid4().hex[:8]}"
    payload = {
        "nombre": "Maria",
        "apellido": "Gomez",
        "documento": doc,
        "telefono": "04141234567",
        "email": "maria@gmail.com",
        "fecha_nacimiento": "1995-05-15",
        "activo": True
    }
    # Create first time
    response1 = client.post("/api/pacientes", json=payload, headers=specialist_headers)
    assert response1.status_code == 201
    
    # Try duplicate
    response2 = client.post("/api/pacientes", json=payload, headers=specialist_headers)
    assert response2.status_code == 400
    assert "Ya existe un paciente con el documento" in response2.json()["detail"]["message"]

def test_get_paciente_success(client, specialist_headers):
    # 1. Create a patient
    payload = {
        "nombre": "Pedro",
        "apellido": "Perez",
        "documento": f"V-{uuid4().hex[:8]}",
        "telefono": "04121234567",
        "email": "pedro@gmail.com",
        "fecha_nacimiento": "1990-08-20",
        "activo": True
    }
    create_res = client.post("/api/pacientes", json=payload, headers=specialist_headers)
    paciente_id = create_res.json()["id"]
    
    # 2. Get the patient
    get_res = client.get(f"/api/pacientes/{paciente_id}", headers=specialist_headers)
    assert get_res.status_code == 200
    assert get_res.json()["nombre"] == "Pedro"

def test_get_paciente_not_found(client, specialist_headers):
    random_id = str(uuid4())
    response = client.get(f"/api/pacientes/{random_id}", headers=specialist_headers)
    assert response.status_code == 404

def test_update_paciente(client, specialist_headers):
    payload = {
        "nombre": "Luis",
        "apellido": "Silva",
        "documento": f"V-{uuid4().hex[:8]}",
        "telefono": "04161234567",
        "email": "luis@gmail.com",
        "fecha_nacimiento": "1988-12-10",
        "activo": True
    }
    create_res = client.post("/api/pacientes", json=payload, headers=specialist_headers)
    paciente_id = create_res.json()["id"]
    
    update_payload = {
        "nombre": "Luis Alberto",
        "telefono": "04167777777"
    }
    update_res = client.patch(f"/api/pacientes/{paciente_id}", json=update_payload, headers=specialist_headers)
    assert update_res.status_code == 200
    assert update_res.json()["nombre"] == "Luis Alberto"
    assert update_res.json()["telefono"] == "04167777777"

def test_delete_paciente_logical(client, specialist_headers):
    payload = {
        "nombre": "Rosa",
        "apellido": "Flores",
        "documento": f"V-{uuid4().hex[:8]}",
        "telefono": "04147654321",
        "email": "rosa@gmail.com",
        "fecha_nacimiento": "1993-01-05",
        "activo": True
    }
    create_res = client.post("/api/pacientes", json=payload, headers=specialist_headers)
    paciente_id = create_res.json()["id"]
    
    delete_res = client.delete(f"/api/pacientes/{paciente_id}", headers=specialist_headers)
    assert delete_res.status_code == 204
    
    # Logical delete means it is still there but active=False, and list_pacientes filters active=True by default
    get_res = client.get(f"/api/pacientes/{paciente_id}", headers=specialist_headers)
    assert get_res.status_code == 200
    assert get_res.json()["activo"] is False

def test_rls_isolation_between_specialists(client, session, test_specialist, specialist_headers):
    from app.models.especialista import Especialista
    from app.api.auth import get_password_hash, create_access_token
    from datetime import date
    
    # 1. Create Specialist B
    especialista_b = Especialista(
        id="c0943115-4691-4413-97fa-1efa21723b52",
        email="specialist_b@vitalnexus.com",
        password_hash=get_password_hash("password123"),
        nombre="Maria",
        apellido="Lopez",
        activo=True,
        suscripcion_activa=True,
        fecha_vencimiento_suscripcion=date(2028, 1, 1),
        plan_suscripcion_id="70cb7e3f-adbb-42da-b76c-8949dcc71134"
    )
    session.add(especialista_b)
    session.commit()
    session.refresh(especialista_b)
    
    # 2. Create JWT headers for Specialist B
    token_b = create_access_token(
        data={"sub": str(especialista_b.id), "email": especialista_b.email, "rol": "especialista"}
    )
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # 3. Specialist A creates a patient
    payload = {
        "nombre": "Paciente A",
        "apellido": "De A",
        "documento": f"V-{uuid4().hex[:8]}",
        "telefono": "04123333333",
        "email": "paciente_a@gmail.com",
        "fecha_nacimiento": "2000-01-01",
        "activo": True
    }
    create_res = client.post("/api/pacientes", json=payload, headers=specialist_headers)
    assert create_res.status_code == 201
    paciente_a_id = create_res.json()["id"]
    
    # 4. Specialist B tries to get Patient A -> Should get 404 Not Found
    get_res_b = client.get(f"/api/pacientes/{paciente_a_id}", headers=headers_b)
    assert get_res_b.status_code == 404
    assert get_res_b.json()["detail"] == "Paciente no encontrado"
    
    # 5. Specialist B tries to update Patient A -> Should get 404 Not Found
    update_res_b = client.patch(f"/api/pacientes/{paciente_a_id}", json={"nombre": "Hack"}, headers=headers_b)
    assert update_res_b.status_code == 404
    
    # 6. Specialist B tries to delete Patient A -> Should get 404 Not Found
    delete_res_b = client.delete(f"/api/pacientes/{paciente_a_id}", headers=headers_b)
    assert delete_res_b.status_code == 404
    
    # 7. Specialist B lists patients -> Should see 0 patients
    list_res_b = client.get("/api/pacientes", headers=headers_b)
    assert list_res_b.status_code == 200
    assert list_res_b.json()["total"] == 0
    
    # 8. Specialist A lists patients -> Should see 1+ patients
    list_res_a = client.get("/api/pacientes", headers=specialist_headers)
    assert list_res_a.status_code == 200
    assert list_res_a.json()["total"] >= 1
    assert any(item["id"] == paciente_a_id for item in list_res_a.json()["items"])
