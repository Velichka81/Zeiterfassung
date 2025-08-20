-- Work schedules per user (simple weekly hours)
CREATE TABLE IF NOT EXISTS work_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    weekly_hours REAL NOT NULL,
    note TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_ws_user ON work_schedule(user_id);
