# SQLite Datenbank für Zeiterfassung

Dieses Projekt verwendet SQLite als Datenbank für die lokale Entwicklung.

## Migrationen
- Migrationen werden im Ordner `db/migration` als SQL-Dateien abgelegt.

## Beispiel: Tabellenstruktur (Sprint A)

```sql
-- Tabelle für Zeiteinträge
CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    note TEXT,
    category TEXT,
    active BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Nutzer
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für User-Settings
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start INTEGER DEFAULT 1, -- 1=Montag
    timezone TEXT DEFAULT 'Europe/Berlin',
    default_rounding INTEGER DEFAULT 5,
    default_category TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

Weitere Migrationen können ergänzt werden.
