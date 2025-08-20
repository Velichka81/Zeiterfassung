-- Absence workflow fields
ALTER TABLE absence ADD COLUMN status TEXT DEFAULT 'PENDING';
ALTER TABLE absence ADD COLUMN approved_by TEXT;
ALTER TABLE absence ADD COLUMN approved_at TEXT;
