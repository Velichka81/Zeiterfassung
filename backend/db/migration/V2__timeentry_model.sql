-- Migration: Passe Tabelle time_entries an das Java-Model an
DROP TABLE IF EXISTS time_entry;
CREATE TABLE time_entry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start DATETIME NOT NULL,
    end DATETIME,
    category TEXT,
    note TEXT
);
