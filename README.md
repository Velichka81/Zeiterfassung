# Zeiterfassung – MVP (Sprint A)

Dieses Projekt ist ein Fullstack-Zeiterfassungssystem mit Java Spring Boot (Backend), React (Frontend) und SQLite (DB).

## Features (Sprint A)
- Manuelle Zeiterfassung mit Überschneidungs-Check
- Tages/Wochen/Monats-Ansichten + Filter
- CSV-Export

## Struktur
- `/backend` – Spring Boot Backend (REST API)
- `/frontend` – React Frontend
- `/backend/db/migration` – Flyway-SQL-Migrationen

## Starten
Empfohlen: getrennt starten

- Backend (Port 8082):
	- PowerShell im Projektroot: `./start-backend.ps1`  (Migration + Spring Boot)
	- Optional ohne Migration: `./start-backend.ps1 -NoMigrate`
- Frontend (Port 5173):
	- PowerShell im Projektroot: `./start-frontend.ps1`

Hinweis: Start beider Dienste erfolgt getrennt über `start-backend.ps1` und `start-frontend.ps1`.

---


