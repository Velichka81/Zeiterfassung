# Zeiterfassung Docker

Docker/Compose-Vorbereitung für den lokalen Betrieb von Backend und Frontend.

Aktuell nutzt das Backend SQLite (Datei) und benötigt keinen separaten DB-Container.

- `docker-compose.yml` (optional, noch nicht finalisiert)
- `.env`-Dateien (optional)

Hinweis: Sobald Container-Builds ergänzt werden, wird das Backend die `schema.sql` beim Start ausführen.

## Nutzung

Aus dem Ordner `docker`:

```powershell
docker compose build
docker compose up -d
```

- Backend: http://localhost:8082
- Frontend: http://localhost:5173

Persistente SQLite-Daten liegen im benannten Volume `backend_db`.
