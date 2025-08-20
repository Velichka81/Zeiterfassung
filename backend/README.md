# Zeiterfassung Backend (Spring Boot)

Dies ist das Backend für die Zeiterfassungs-App. Implementiert mit Java, Spring Boot und JPA.

## Features (Sprint A)
- Manuelle Zeiterfassung mit Überschneidungs-Check
- Tages/Wochen/Monats-Ansichten + Filter
- CSV-Export

## Starten (lokal)
1. Java 17+ und Maven installieren
2. Variante A (empfohlen): Im Projektroot `./start-backend.ps1`
3. Variante B: Im Ordner `backend`
	- `mvn -q flyway:migrate`
	- `mvn spring-boot:run`

## Datenbank
- Migrationen via Flyway (SQL-Dateien in `backend/db/migration`)

---


