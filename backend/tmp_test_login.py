import httpx
import json

async def test_login():
    async with httpx.AsyncClient() as client:
        # Specialists
        url_spec = "http://127.0.0.1:8002/api/auth/login"
        payloads_spec = [
            {"email": "admin@odontofocus.com", "password": "123456"},
            {"email": "admin@odontofocus.com", "password": "123456."}
        ]
        for payload in payloads_spec:
            print(f"Testing SPECIALIST with password: {payload['password']}")
            resp = await client.post(url_spec, json=payload)
            print(f"Status: {resp.status_code}, Body: {resp.text[:50]}...")

        # Admins
        url_admin = "http://127.0.0.1:8002/api/admin/auth/login"
        payloads_admin = [
            {"email": "smartlift1608@gmail.com", "password": "Admin123!"}
        ]
        for payload in payloads_admin:
            print(f"Testing ADMIN with password: {payload['password']}")
            resp = await client.post(url_admin, json=payload)
            print(f"Status: {resp.status_code}, Body: {resp.text[:50]}...")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_login())
