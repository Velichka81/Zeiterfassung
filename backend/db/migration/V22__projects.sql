-- Migration: Projekte und Projektzuweisungen
CREATE TABLE project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    customer TEXT,
    start_date DATE,
    end_date DATE,
    budget_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'AKTIV'
);

CREATE TABLE project_assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- WorkSession: Referenz auf Projekt
ALTER TABLE work_session ADD COLUMN project_id INTEGER REFERENCES project(id);

-- Default-Projekt (Allgemein/Administration)
INSERT INTO project (name, description, customer, status) VALUES ('Allgemein / Administration', 'Standardprojekt für nicht zugeordnete Zeiten', '', 'AKTIV');
