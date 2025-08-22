# Zeiterfassung

Fullstack Zeiterfassung (Java Spring Boot + React + SQLite) ohne Flyway – Schema wird über eine einzige `schema.sql` initialisiert.

## Aktuelle Features
* Auth (JWT) mit Rollen USER / ADMIN
* Benutzerverwaltung (Admin): Anlegen, Rollenwechsel, Sperren, Passwort zurücksetzen, Profilbild hochladen (Uploads unter `/api/admin/uploads/...`)
* Arbeitszeit-Erfassung (Time Entries) mit Überschneidungs-Prüfung, Liste + CSV Export (`/api/entries/export.csv`)
* Work Sessions (Start/Stop + Pausefelder) – persistente Sitzungen je Benutzer
* Abwesenheiten (Absence) inkl. Status/Approval Felder (approved_by/at, status, has_atest)
* Overtime Adjustments & Allowances Tabellen vorbereitet
* Saubere Trennung Frontend/Backend, einfache lokale DB (SQLite-Datei)

## Projektstruktur
```
backend/   Spring Boot REST API (Port 8082)
frontend/  React (Vite) UI (Port 5173)
db/        (optional globale Ablage / Scripts) – eigentliche DB liegt unter backend/db
scripts (*.ps1) Start/Reset/Seed Hilfen
```

## Wichtige Dateien / Scripts
| Script | Zweck |
|--------|-------|
| `start-backend.ps1` | Beendet Prozess(e) auf 8082 und startet Spring Boot |
| `start-frontend.ps1` | Startet Vite Dev Server |
| `reset-db.ps1` | Löscht `backend/db/zeiterfassung.db` und ermöglicht Neuaufbau über `schema.sql` |
| `seed-demo-data.ps1` | (Falls vorhanden) Seed von Demodaten |
| `stop-ports.ps1` | Ports freigeben (8082 / 5173) |

## Start (Entwicklung)
PowerShell im Projektroot:
```
./start-backend.ps1
./start-frontend.ps1
```
Frontend nutzt Proxy auf `http://localhost:8082/api`.

### DB Zurücksetzen
```
./reset-db.ps1
./start-backend.ps1
```
Damit wird die SQLite Datei entfernt und beim nächsten Start via `schema.sql` neu aufgebaut.

## Konfiguration
`backend/src/main/resources/application.properties`:
```
server.port=8082
spring.datasource.url=jdbc:sqlite:db/zeiterfassung.db
spring.sql.init.schema-locations=classpath:schema.sql
spring.jpa.hibernate.ddl-auto=none
```
JWT Secret liegt (falls konfiguriert) in Umgebungsvariablen; Admin-Seed Benutzer/Pass via `APP_ADMIN_USER` / `APP_ADMIN_PASS` (Fallback admin/admin123).

## Docker (Optional)
Es existiert ein einfacher Multi-Stage Dockerfile im Backend und Frontend. Beispiel (Backend):
```
cd backend
docker build -t zeiterfassung-backend .
docker run -p 8082:8082 zeiterfassung-backend
```
Persistenz: Standardmäßig wird DB im Container unter `/app/db/zeiterfassung.db` angelegt. Für Persistenz Volume mounten:
```
docker run -p 8082:8082 -v %cd%/dbdata:/app/db zeiterfassung-backend
```

## API Kurzüberblick (Auszug)
| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/auth/register` | POST | Benutzer registrieren |
| `/api/auth/login` | POST | Login, liefert JWT |
| `/api/auth/me` | GET | Aktueller Benutzer |
| `/api/entries` | GET/POST | Zeiteinträge user-spez. / anlegen |
| `/api/entries/{id}` | PUT/DELETE | Update / Löschen |
| `/api/entries/export.csv` | GET | CSV Export eigener Einträge |
| `/api/worksessions/me` | GET | Eigene Work Sessions |
| `/api/worksessions/start` | POST | Session starten |
| `/api/worksessions/stop/{id}` | POST | Session stoppen |
| `/api/admin/users` | GET/POST | User-Liste / anlegen (Admin) |
| `/api/admin/users/{id}` | PUT | Benutzername ändern |
| `/api/admin/users/{id}/role` | PUT | Rolle setzen |
| `/api/admin/users/{id}/lock` | PUT | Sperren/Entsperren |
| `/api/admin/users/{id}/image` | PUT/POST | Bild URL setzen / Datei hochladen |

## Datenbank / Schema
Eine einzige Datei `schema.sql` definiert alle Tabellen (users, work_session, time_entry, absence, absence_allowance, overtime_adjustment, audit_log).
Änderungen am Schema erfordern aktuell manuelles Löschen der DB-Datei für destructive Updates.

## Entwicklungshinweise
* Keine Flyway Migrationen mehr – alte Migrationsdateien entfernt.
* Bei Änderungen an Spalten: DB löschen oder manuell ALTER anwenden.
* WorkSession nutzt Snake Case Spalten (`pause_seconds`, `pause_active`).

## Lizenz
Interner Projektstatus (keine Lizenz angegeben).



