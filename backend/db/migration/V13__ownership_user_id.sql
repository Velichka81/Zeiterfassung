-- Add user ownership to entries and absences
ALTER TABLE time_entry ADD COLUMN user_id INTEGER;
ALTER TABLE absence ADD COLUMN user_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_time_entry_user ON time_entry(user_id);
CREATE INDEX IF NOT EXISTS idx_absence_user ON absence(user_id);
-- Assign existing rows to admin if present
UPDATE time_entry SET user_id = (SELECT id FROM users WHERE username='admin') WHERE user_id IS NULL;
UPDATE absence SET user_id = (SELECT id FROM users WHERE username='admin') WHERE user_id IS NULL;
