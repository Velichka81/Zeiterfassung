-- Purge demo-seeded absence rows that match known notes/types used in prior seeds
DELETE FROM absence WHERE note IN ('Sommerurlaub','Erkältung','Umzug')
  OR (type IN ('Urlaub','Krankheit','Sonderurlaub') AND start_date BETWEEN '2025-07-01' AND '2025-08-31');
