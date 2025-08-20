-- Holidays
CREATE TABLE IF NOT EXISTS holiday (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    name TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_holiday_date ON holiday(date);
