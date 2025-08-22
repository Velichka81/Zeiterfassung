# Zeiterfassung Backend (Spring Boot)

Dies ist das Backend für die Zeiterfassungs-App. Implementiert mit Java, Spring Boot und JPA.

## Features (Sprint A)
- Manuelle Zeiterfassung mit Überschneidungs-Check
- Tages/Wochen/Monats-Ansichten + Filter
- CSV-Export

## Starten (lokal)
1. Java 17+ und Maven installieren
2. Im Projektroot `./start-backend.ps1`
3. Alternativ im Ordner `backend`: `mvn spring-boot:run`

## Datenbank
- Initialisierung via `src/main/resources/schema.sql` (kein Flyway)

---


