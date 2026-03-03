# Docker — Odonto-Focus

## Uso local

Desde la **raíz del proyecto**:

```bash
docker compose -f docker/docker-compose.yml up -d
```

O desde esta carpeta (asegurando que el contexto de build sea el padre):

```bash
docker compose up -d
```

Copiar `.env.example` de la raíz a `.env` y rellenar secretos (no subir `.env` al repo).

## Servicios

- **postgres**: Puerto 5432. Volumen `postgres_data`.
- **backend**: FastAPI en 8000. Depende de postgres.
- **frontend**: Next.js en 3000. Depende de backend.
- **redis**: Perfil `full`. Para cola de mensajes: `docker compose --profile full up -d`.

## VPS (Easy Panel)

IP del VPS: **147.93.184.194**. En Fase 6 se documentará la configuración exacta para Easy Panel (dominio, SSL, variables).
