-- Abwesenheiten: Urlaub, Krankheit, Sonderurlaub
CREATE TABLE IF NOT EXISTS absence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    type TEXT NOT NULL,
    note TEXT
);
