import pytest
from uuid import uuid4

def test_service_recipe_cost_and_utility(client, specialist_headers, session):
    from app.models.insumo_servicio import Insumo, Servicio, ServicioInsumo
    
    # 1. Create Insumos
    ins1 = Insumo(
        id=uuid4(),
        especialista_id="c0943115-4691-4413-97fa-1efa21723b51",
        nombre="Guantes Nitrilo",
        costo_unitario=0.50,
        stock_actual=100.0,
        stock_minimo=10.0,
        activo=True
    )
    ins2 = Insumo(
        id=uuid4(),
        especialista_id="c0943115-4691-4413-97fa-1efa21723b51",
        nombre="Anestesia Tubo",
        costo_unitario=1.20,
        stock_actual=50.0,
        stock_minimo=5.0,
        activo=True
    )
    session.add(ins1)
    session.add(ins2)
    session.commit()
    
    # 2. Create Service
    service = Servicio(
        id=uuid4(),
        especialista_id="c0943115-4691-4413-97fa-1efa21723b51",
        nombre="Extracción Simple",
        precio=40.0,
        activo=True
    )
    session.add(service)
    session.commit()
    
    # 3. Associate Insumos to Service Recipe (2 guantes + 1 anestesia)
    si1 = ServicioInsumo(
        servicio_id=service.id,
        insumo_id=ins1.id,
        cantidad_utilizada=2.0
    )
    si2 = ServicioInsumo(
        servicio_id=service.id,
        insumo_id=ins2.id,
        cantidad_utilizada=1.0
    )
    session.add(si1)
    session.add(si2)
    session.commit()
    
    # Cost = (2 * 0.50) + (1 * 1.20) = 2.20
    # Utility = 40.0 - 2.20 = 37.80
    
    # Query the database view v_rentabilidad_servicios directly to test calculations
    from sqlalchemy import text
    res = session.execute(
        text("SELECT costo_insumos, utilidad_neta FROM sys_config.v_rentabilidad_servicios WHERE servicio_id = :id"),
        {"id": service.id}
    ).first()
    
    assert res is not None
    assert float(res[0]) == 2.20
    assert float(res[1]) == 37.80

def test_presupuesto_and_abonos_database_triggers(client, specialist_headers, session):
    from app.models.paciente import Paciente
    
    # 1. Create Patient
    paciente = Paciente(
        nombre="Juan",
        apellido="Tester",
        documento=f"V-{uuid4().hex[:8]}",
        telefono="04141112233",
        activo=True,
        especialista_id="c0943115-4691-4413-97fa-1efa21723b51"
    )
    session.add(paciente)
    session.commit()
    session.refresh(paciente)
    
    # 2. Create Budget (Presupuesto) with Details (1x 30$ and 2x 10$)
    payload = {
        "paciente_id": str(paciente.id),
        "estado": "aprobado",
        "detalles": [
            {
                "descripcion": "Consulta Diagnostica",
                "cantidad": 1.0,
                "precio_unitario": 30.0
            },
            {
                "descripcion": "Limpieza",
                "cantidad": 2.0,
                "precio_unitario": 10.0
            }
        ]
    }
    response = client.post("/api/presupuestos", json=payload, headers=specialist_headers)
    assert response.status_code == 201
    pres_data = response.json()
    pres_id = pres_data["id"]
    
    # Assert that trigger details_recalcular_total automatically calculated total and balance
    # Total should be 30*1 + 10*2 = 50.0$
    assert float(pres_data["total"]) == 50.0
    assert float(pres_data["saldo_pendiente"]) == 50.0
    assert pres_data["estado"] == "aprobado"
    
    # 3. Create Abono of 20$
    abono_payload1 = {
        "presupuesto_id": pres_id,
        "monto": 20.0,
        "metodo_pago": "efectivo_dolar",
        "notas": "Primer abono"
    }
    abono_res1 = client.post("/api/abonos", json=abono_payload1, headers=specialist_headers)
    assert abono_res1.status_code == 201
    abono1_id = abono_res1.json()["id"]
    
    # Get budget again to verify update from trigger abonos_recalcular_saldo
    # Saldo should be 50.0 - 20.0 = 30.0$, state should be "en_pago"
    get_res1 = client.get(f"/api/presupuestos/{pres_id}", headers=specialist_headers)
    assert float(get_res1.json()["saldo_pendiente"]) == 30.0
    assert get_res1.json()["estado"] == "en_pago"
    
    # 4. Create Abono of 30$ (completing payment)
    abono_payload2 = {
        "presupuesto_id": pres_id,
        "monto": 30.0,
        "metodo_pago": "transferencia_nacional"
    }
    abono_res2 = client.post("/api/abonos", json=abono_payload2, headers=specialist_headers)
    assert abono_res2.status_code == 201
    
    # Saldo should be 0$, state should be "pagado"
    get_res2 = client.get(f"/api/presupuestos/{pres_id}", headers=specialist_headers)
    assert float(get_res2.json()["saldo_pendiente"]) == 0.0
    assert get_res2.json()["estado"] == "pagado"
    
    # 5. Delete first abono (revoking 20$)
    # Clean up any messages in the communications queue referring to this abono to avoid ForeignKeyViolation
    from app.models.comunicaciones import ColaMensaje
    from sqlmodel import select
    stmt = select(ColaMensaje).where(ColaMensaje.abono_id == abono1_id)
    msgs = session.exec(stmt).all()
    for msg in msgs:
        session.delete(msg)
    session.commit()
    
    delete_res = client.delete(f"/api/abonos/{abono1_id}", headers=specialist_headers)
    assert delete_res.status_code == 204
    
    # Saldo should revert back to 20.0$ (50.0 total - 30.0 remaining abono), state should be "en_pago"
    get_res3 = client.get(f"/api/presupuestos/{pres_id}", headers=specialist_headers)
    assert float(get_res3.json()["saldo_pendiente"]) == 20.0
    assert get_res3.json()["estado"] == "en_pago"
