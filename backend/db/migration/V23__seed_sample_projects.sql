-- Seed: fünf Beispiel-Projekte zum Testen
INSERT INTO project (name, description, customer, start_date, end_date, budget_minutes, status)
VALUES
  ('Website Relaunch', 'Neue Unternehmensseite mit CMS', 'Acme GmbH', '2025-01-15', '2025-06-30', 20000, 'AKTIV'),
  ('Mobile App v2', 'Neue Features und Refactoring', 'Beta AG', '2025-02-01', '2025-09-30', 30000, 'AKTIV'),
  ('Datenmigration', 'Altsystem -> Cloud', 'Cloudify Ltd.', '2025-03-01', '2025-04-30', 8000, 'ABGESCHLOSSEN'),
  ('Support & Wartung', 'Laufender Supportvertrag', 'Globex', NULL, NULL, 12000, 'AKTIV'),
  ('POC KI-Assistent', 'Prototyp für internen Assistenten', 'Intern', '2025-04-10', '2025-05-31', 5000, 'INAKTIV');
