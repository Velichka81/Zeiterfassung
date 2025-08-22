CREATE TABLE IF NOT EXISTS work_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time TEXT,
    end_time TEXT,
    pause_seconds INTEGER DEFAULT 0,
    pause_active BOOLEAN DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    status TEXT DEFAULT 'unbestätigt',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AbsenceAllowance
CREATE TABLE IF NOT EXISTS absence_allowance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    year INTEGER NOT NULL,
    days INTEGER NOT NULL,
    UNIQUE(user_id, type, year),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- OvertimeAdjustment
CREATE TABLE IF NOT EXISTS overtime_adjustment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT,
    minutes INTEGER NOT NULL,
    type TEXT,
    note TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AuditLog
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT,
    admin_username TEXT,
    action TEXT,
    target_type TEXT,
    target_id INTEGER,
    details TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    locked INTEGER DEFAULT 0,
    image_url TEXT,
    work_model TEXT,
    weekly_hours_minutes INTEGER,
    regular_days TEXT,
    regular_time TEXT
);

-- Projekt-Tabellen entfernt

CREATE TABLE IF NOT EXISTS time_entry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start TEXT NOT NULL,
    end TEXT,
    category TEXT,
    note TEXT,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS absence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    type TEXT NOT NULL,
    note TEXT,
    has_atest INTEGER DEFAULT 0,
    status TEXT,
    approved_by TEXT,
    approved_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
