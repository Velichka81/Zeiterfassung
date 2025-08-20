CREATE TABLE IF NOT EXISTS absence_allowance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    year INTEGER NOT NULL,
    days INTEGER NOT NULL,
    CONSTRAINT uq_user_type_year UNIQUE(user_id, type, year)
);
