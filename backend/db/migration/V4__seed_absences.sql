-- Seed demo data for absence table
-- Dates use ISO format (YYYY-MM-DD)

INSERT INTO absence (start_date, end_date, type, note)
VALUES
  ('2025-08-01', '2025-08-05', 'Urlaub', 'Sommerurlaub'),
  ('2025-08-10', NULL,          'Krankheit', 'Erkältung'),
  ('2025-08-15', '2025-08-16', 'Sonderurlaub', 'Umzug'),
  ('2025-07-29', '2025-08-02', 'Urlaub', 'Monatswechsel');
