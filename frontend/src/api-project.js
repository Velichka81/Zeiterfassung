// Projekte-API deaktiviert: Stubs für Rückbau auf Zustand vor Projekte-Feature
export async function fetchProjects() { return []; }
export async function createProject() { throw new Error('Projekte-Feature ist deaktiviert'); }
export async function updateProject() { throw new Error('Projekte-Feature ist deaktiviert'); }
export async function deleteProject() { throw new Error('Projekte-Feature ist deaktiviert'); }
export async function fetchAssignments() { return []; }
export async function assignUserToProject() { throw new Error('Projekte-Feature ist deaktiviert'); }
export async function removeAssignment() { throw new Error('Projekte-Feature ist deaktiviert'); }
export async function updateAssignmentRole() { throw new Error('Projekte-Feature ist deaktiviert'); }
