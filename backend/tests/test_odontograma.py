import pytest
from uuid import uuid4
from datetime import date

def test_list_hallazgos(client, specialist_headers):
    response = client.get("/api/odontograma/hallazgos", headers=specialist_headers)
    assert response.status_code == 200
    res_data = response.json()
    assert len(res_data) >= 2
    codigos = [h["codigo"] for h in res_data]
    assert "CARIES" in codigos
    assert "RESINA_OBT" in codigos

def test_odontograma_inmutability_and_evolution(client, specialist_headers, session):
    from app.models.paciente import Paciente
    
    # 1. Create test patient
    paciente = Paciente(
        nombre="Julian",
        apellido="Sanz",
        documento=f"V-{uuid4().hex[:8]}",
        telefono="04128888888",
        activo=True,
        especialista_id="c0943115-4691-4413-97fa-1efa21723b51"
    )
    session.add(paciente)
    session.commit()
    session.refresh(paciente)
    
    paciente_id = str(paciente.id)
    
    # Hallazgo IDs from seeds in conftest
    caries_id = "5a14ad31-7e8c-42e6-a0de-678f21723b51"
    resina_id = "5b14ad31-7e8c-42e6-a0de-678f21723b51"
    
    # 2. Insert CARIES on tooth 18, face V, dated 2026-06-01
    payload1 = {
        "paciente_id": paciente_id,
        "numero_diente": 18,
        "cara_diente": "V",
        "hallazgo_id": caries_id,
        "fecha_registro": "2026-06-01",
        "notas": "Caries superficial"
    }
    response1 = client.post("/api/odontograma/registros", json=payload1, headers=specialist_headers)
    assert response1.status_code == 201
    reg1_id = response1.json()["id"]
    
    # 3. Insert RESINA on tooth 18, face V, dated 2026-06-05
    payload2 = {
        "paciente_id": paciente_id,
        "numero_diente": 18,
        "cara_diente": "V",
        "hallazgo_id": resina_id,
        "fecha_registro": "2026-06-05",
        "notas": "Resina colocada"
    }
    response2 = client.post("/api/odontograma/registros", json=payload2, headers=specialist_headers)
    assert response2.status_code == 201
    reg2_id = response2.json()["id"]
    
    # Verify inmutability: both records exist in DB (no update occurred)
    hist_response = client.get(
        f"/api/pacientes/{paciente_id}/odontograma/historial?numero_diente=18&cara_diente=V",
        headers=specialist_headers
    )
    assert hist_response.status_code == 200
    hist_data = hist_response.json()
    assert len(hist_data) == 2
    assert hist_data[0]["id"] == reg2_id  # Ordered desc
    assert hist_data[1]["id"] == reg1_id
    
    # 4. Verify evolutive reconstruction
    # Check status as of 2026-06-02 (should show CARIES)
    status_res1 = client.get(
        f"/api/pacientes/{paciente_id}/odontograma?fecha=2026-06-02",
        headers=specialist_headers
    )
    assert status_res1.status_code == 200
    dientes1 = status_res1.json()["dientes"]
    assert len(dientes1) == 1
    assert dientes1[0]["numero_diente"] == 18
    assert dientes1[0]["cara_diente"] == "V"
    assert dientes1[0]["hallazgo_codigo"] == "CARIES"
    
    # Check status as of 2026-06-06 (should show RESINA_OBT)
    status_res2 = client.get(
        f"/api/pacientes/{paciente_id}/odontograma?fecha=2026-06-06",
        headers=specialist_headers
    )
    assert status_res2.status_code == 200
    dientes2 = status_res2.json()["dientes"]
    assert len(dientes2) == 1
    assert dientes2[0]["numero_diente"] == 18
    assert dientes2[0]["cara_diente"] == "V"
    assert dientes2[0]["hallazgo_codigo"] == "RESINA_OBT"

def test_delete_odontograma_registro(client, specialist_headers, session):
    from app.models.paciente import Paciente
    paciente = Paciente(
        nombre="Luz",
        apellido="Mendez",
        documento=f"V-{uuid4().hex[:8]}",
        telefono="04129999999",
        activo=True,
        especialista_id="c0943115-4691-4413-97fa-1efa21723b51"
    )
    session.add(paciente)
    session.commit()
    session.refresh(paciente)
    
    payload = {
        "paciente_id": str(paciente.id),
        "numero_diente": 11,
        "cara_diente": "O",
        "hallazgo_id": "5a14ad31-7e8c-42e6-a0de-678f21723b51",
        "fecha_registro": "2026-06-01"
    }
    response = client.post("/api/odontograma/registros", json=payload, headers=specialist_headers)
    reg_id = response.json()["id"]
    
    # Delete the record
    delete_res = client.delete(f"/api/odontograma/registros/{reg_id}", headers=specialist_headers)
    assert delete_res.status_code == 204
    
    # Verify it is gone
    hist_response = client.get(
        f"/api/pacientes/{paciente.id}/odontograma/historial?numero_diente=11",
        headers=specialist_headers
    )
    assert len(hist_response.json()) == 0
