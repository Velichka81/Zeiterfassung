import React, { useEffect, useState } from "react";
import {
  fetchAdminUsers,
  createAdminUser,
  setUserRole,
  setUserImage,
  uploadUserImage,
  fetchAbsences,
  updateAbsence,
} from "../api";

// Styles
const titleStyle = {
  color: "var(--color-accent)",
  fontWeight: 700,
  fontSize: "2em",
  marginBottom: "1.5em",
  letterSpacing: "0.5px",
  textShadow: "0 2px 16px var(--color-shadow)",
};
const formStyle = {
  display: "flex",
  gap: 18,
  marginBottom: 28,
  alignItems: "flex-end",
  background: "rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: "1.2em 1em",
  boxShadow: "0 2px 16px 0 var(--color-shadow)",
};
const inputStyle = {
  padding: "0.7em 1.2em",
  borderRadius: 8,
  border: "1.5px solid var(--color-border)",
  fontSize: "1.08em",
  background: "var(--color-bg)",
  color: "var(--color-text)",
  minWidth: 160,
  boxShadow: "0 1px 6px 0 var(--color-shadow-light)",
};
const selectStyle = {
  ...inputStyle,
  minWidth: 120,
  maxWidth: "none",
  width: "auto",
  cursor: "pointer",
  whiteSpace: "normal",
  overflow: "visible",
};
const buttonStyle = {
  padding: "0.7em 1.5em",
  borderRadius: 8,
  border: "none",
  background: "var(--color-accent)",
  color: "#222",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "1.08em",
  boxShadow: "0 2px 8px 0 var(--color-shadow)",
  transition: "background 0.2s",
};
const smallButtonStyle = {
  ...buttonStyle,
  fontSize: "0.98em",
  padding: "0.4em 1em",
  borderRadius: 6,
  margin: 0,
};
const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: "1.05em",
  background: "rgba(0,0,0,0.04)",
  borderRadius: 12,
  boxShadow: "0 2px 16px 0 var(--color-shadow)",
  overflow: "hidden",
};
const thStyle = {
  background: "var(--color-table-header, #1a1a1a)",
  color: "var(--color-accent)",
  fontWeight: 700,
  padding: "0.9em 0.7em",
  borderBottom: "2.5px solid var(--color-border)",
  textAlign: "left",
  fontSize: "1.08em",
  letterSpacing: "0.2px",
};
const tdStyle = {
  padding: "0.7em 0.7em",
  borderBottom: "1.5px solid var(--color-border)",
  verticalAlign: "top",
  background: "rgba(0,0,0,0.02)",
};
const cardStyle = {
  background: "var(--color-card)",
  borderRadius: "1.2em",
  boxShadow: "0 2px 16px 0 var(--color-shadow)",
  padding: "2.2em 2em 2em 2em",
  margin: "2em auto",
  maxWidth: 900,
  minWidth: 400,
  color: "var(--color-text)",
  fontSize: "1.1em",
};
const errorStyle = {
  color: "#ff5c5c",
  marginBottom: "1em",
  fontWeight: 500,
};

export default function AdminPanel({ auth, onAbsenceChanged }) {
  // Status-Filter für Abwesenheiten (Admin)
  const [absenceStatusFilter, setAbsenceStatusFilter] = useState('ALLE');
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="admin-status-filter-unique" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Status filtern:</label>
            <select
              id="admin-status-filter-unique"
              value={absenceStatusFilter || 'ALLE'}
              onChange={e => setAbsenceStatusFilter(e.target.value)}
              style={{ padding: '0.3em 1em', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-accent)', fontWeight: 600 }}
            >
              <option value="ALLE">Alle</option>
              <option value="APPROVED">genehmigt</option>
              <option value="REJECTED">abgelehnt</option>
              <option value="PENDING">wird überprüft</option>
            </select>
          </div>
  // Users
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "", role: "USER" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", role: "USER", password: "" });
  const [imageInputs, setImageInputs] = useState({});
  const [fileInputs, setFileInputs] = useState({});
  const [tab, setTab] = useState("users");

  // Absences
  const [absences, setAbsences] = useState([]);
  const [absLoading, setAbsLoading] = useState(false);

  // Initial users load
  useEffect(() => {
    setLoading(true);
    fetchAdminUsers(auth.token)
      .then(setUsers)
      .catch((e) => setError(e.message || "Fehler"))
      .finally(() => setLoading(false));
  }, [auth]);

  // Load absences when tab selected
  useEffect(() => {
    if (tab !== "absences") return;
    setAbsLoading(true);
    fetchAbsences()
      .then(setAbsences)
      .catch((e) => setError(e.message || "Fehler"))
      .finally(() => setAbsLoading(false));
  }, [tab]);

  // Handlers
  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const user = await createAdminUser(form, auth.token);
      setUsers((u) => [...u, user]);
      setForm({ username: "", password: "", role: "USER" });
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(id, role) {
    setError("");
    try {
      const user = await setUserRole(id, role, auth.token);
      setUsers((u) => u.map((x) => (x.id === id ? user : x)));
    } catch (e) {
      setError(e.message || "Fehler");
    }
  }

  function handleEditClick(u) {
    setEditId(u.id);
    setEditForm({ username: u.username, role: u.role, password: "" });
  }
  function handleEditChange(e) {
    setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleEditCancel() {
    setEditId(null);
    setEditForm({ username: "", role: "USER", password: "" });
  }

  async function handleEditSave(id) {
    setError("");
    try {
      let changed = false;
      const userOrig = users.find((u) => u.id === id);
      if (
        editForm.username &&
        editForm.username !== userOrig?.username &&
        editForm.username.trim() !== ""
      ) {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({ username: editForm.username }),
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Fehler beim Ändern des Benutzernamens");
        }
        changed = true;
      }
      if (editForm.role && editForm.role !== userOrig?.role) {
        await handleRoleChange(id, editForm.role);
        changed = true;
      }
      if (editForm.password && editForm.password.length >= 4) {
        const res = await fetch(`/api/admin/users/${id}/password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({ password: editForm.password }),
        });
        if (!res.ok) throw new Error("Fehler beim Ändern des Passworts");
        changed = true;
      }
      if (changed) {
        const updated = await fetchAdminUsers(auth.token);
        setUsers(updated);
      }
      setEditId(null);
      setEditForm({ username: "", role: "USER", password: "" });
    } catch (e) {
      setError(e.message || "Fehler");
    }
  }

  function handleImageInputChange(id, value) {
    setImageInputs((inputs) => ({ ...inputs, [id]: value }));
  }
  function handleFileChange(id, file) {
    const max = 2 * 1024 * 1024;
    if (file && file.size > max) {
      setError("Datei zu groß (max 2MB)");
      setFileInputs((prev) => ({ ...prev, [id]: null }));
      return;
    }
    setError("");
    setFileInputs((prev) => ({ ...prev, [id]: file }));
  }
  async function handleImageSave(id) {
    setError("");
    try {
      const url = imageInputs[id] || "";
      const user = await setUserImage(id, url, auth.token);
      setUsers((u) => u.map((x) => (x.id === id ? user : x)));
      setImageInputs((inputs) => ({ ...inputs, [id]: "" }));
    } catch (e) {
      setError(e.message || "Fehler");
    }
  }
  async function handleFileUpload(id) {
    setError("");
    try {
      const file = fileInputs[id];
      if (!file) return;
      const user = await uploadUserImage(id, file, auth.token);
      setUsers((u) => u.map((x) => (x.id === id ? user : x)));
      setFileInputs((prev) => ({ ...prev, [id]: null }));
    } catch (e) {
      setError(e.message || "Fehler");
    }
  }

  async function handleApproveAbsence(a) {
    setError("");
    try {
      const updated = await updateAbsence(a.id, {
        ...a,
        status: "APPROVED",
        approvedBy: auth.username,
        approvedAt: new Date().toISOString(),
      });
      setAbsences((list) => list.map((x) => (x.id === a.id ? updated : x)));
      onAbsenceChanged && onAbsenceChanged();
    } catch (e) {
      setError(e.message || "Fehler beim Genehmigen");
    }
  }
  async function handleRejectAbsence(a) {
    setError("");
    try {
      const updated = await updateAbsence(a.id, {
        ...a,
        status: "REJECTED",
        approvedBy: auth.username,
        approvedAt: new Date().toISOString(),
      });
      setAbsences((list) => list.map((x) => (x.id === a.id ? updated : x)));
      onAbsenceChanged && onAbsenceChanged();
    } catch (e) {
      setError(e.message || "Fehler beim Ablehnen");
    }
  }

  return (
    <div className="admin-panel" style={cardStyle}>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <button className={tab === "users" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("users")}>
          Benutzer
        </button>
        <button className={tab === "absences" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("absences")}>
          Abwesenheiten
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {tab === "users" && (
        <>
          <div style={titleStyle}>User-Verwaltung</div>
          <form onSubmit={handleCreate} style={{ ...formStyle, flexWrap: "nowrap", flexDirection: "row" }} autoComplete="off">
            <input name="username" value={form.username} onChange={handleChange} placeholder="Benutzername" required style={inputStyle} />
            <input name="password" value={form.password} onChange={handleChange} placeholder="Passwort" type="password" required minLength={4} style={inputStyle} />
            <select name="role" value={form.role} onChange={handleChange} style={selectStyle}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" disabled={saving} style={buttonStyle}>
              Anlegen
            </button>
          </form>

          {loading ? (
            <div>Lade Benutzer...</div>
          ) : (
            <div style={{ maxHeight: "340px", overflowY: "auto", marginBottom: "1em", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
              <table style={tableStyle} className="admin-user-table">
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Benutzer</th>
                    <th style={thStyle}>Rolle</th>
                    <th style={thStyle}>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={tdStyle}>{u.id}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {u.imageUrl ? (
                            <img src={u.imageUrl} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--color-border)" }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: "1.1em", border: "1.5px solid var(--color-border)" }}>
                              <span role="img" aria-label="avatar">
                                👤
                              </span>
                            </div>
                          )}
                          <span>{u.username}</span>
                        </div>

                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <input type="text" placeholder="Bild-URL..." value={imageInputs[u.id] || ""} onChange={(e) => handleImageInputChange(u.id, e.target.value)} style={{ ...inputStyle, maxWidth: 180, fontSize: "1em", padding: "0.45em 1em" }} />
                            <button type="button" style={{ ...smallButtonStyle }} onClick={() => handleImageSave(u.id)} disabled={!imageInputs[u.id] || imageInputs[u.id].length < 5}>
                              Bild speichern
                            </button>
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <input id={`admin-file-upload-${u.id}`} type="file" accept="image/png,image/jpeg,image/svg+xml" style={{ display: "none" }} onChange={(e) => handleFileChange(u.id, e.target.files?.[0])} />
                            <label htmlFor={`admin-file-upload-${u.id}`} style={{ ...smallButtonStyle, background: "#222", color: "var(--color-accent)", border: "1.5px solid var(--color-accent)" }}>
                              Datei auswählen
                            </label>
                            <span style={{ color: "var(--color-text)", fontSize: "0.97em", minWidth: 120 }}>{fileInputs[u.id] ? fileInputs[u.id].name : "Keine Datei gewählt"}</span>
                            {fileInputs[u.id] && (
                              <>
                                <img src={URL.createObjectURL(fileInputs[u.id])} alt="preview" style={{ width: 38, height: 38, objectFit: "cover", borderRadius: "50%", border: "2px solid var(--color-accent)" }} />
                                <button type="button" style={{ ...smallButtonStyle }} onClick={() => handleFileUpload(u.id)} disabled={!fileInputs[u.id]}>
                                  Hochladen
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: 8 }}>
                          {editId === u.id ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleEditSave(u.id); }} style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                              <input name="username" value={editForm.username} onChange={handleEditChange} placeholder="Benutzername" style={{ ...inputStyle, maxWidth: 180 }} />
                              <select name="role" value={editForm.role} onChange={handleEditChange} style={{ ...selectStyle, maxWidth: 120 }}>
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              <input name="password" value={editForm.password} onChange={handleEditChange} placeholder="Neues Passwort (min. 4 Zeichen)" type="password" minLength={4} style={{ ...inputStyle, maxWidth: 180 }} />
                              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                                <button type="submit" style={smallButtonStyle}>Speichern</button>
                                <button type="button" style={{ ...smallButtonStyle, background: "#888", color: "#fff" }} onClick={handleEditCancel}>Abbrechen</button>
                              </div>
                            </form>
                          ) : (
                            <button type="button" style={{ ...smallButtonStyle, marginTop: 2 }} onClick={() => handleEditClick(u)}>Bearbeiten</button>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {editId === u.id ? (
                          <select name="role" value={editForm.role} onChange={handleEditChange} style={selectStyle}>
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        ) : (
                          <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={u.role === "ADMIN" && users.filter((x) => x.role === "ADMIN").length <= 1} style={selectStyle}>
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        )}
                      </td>
                      <td style={tdStyle}>{u.role === "ADMIN" && users.filter((x) => x.role === "ADMIN").length <= 1 ? <span style={{ color: "#ffb347", fontWeight: 600 }}>Letzter Admin</span> : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "absences" && (
        <div style={{ marginTop: 16 }}>
          {/* Status-Filter für Abwesenheiten */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="admin-status-filter-unique" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Status filtern:</label>
            <select
              id="admin-status-filter-unique"
              value={absenceStatusFilter || 'ALLE'}
              onChange={e => setAbsenceStatusFilter(e.target.value)}
              style={{ padding: '0.3em 1em', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-accent)', fontWeight: 600 }}
            >
              <option value="ALLE">Alle</option>
              <option value="APPROVED">genehmigt</option>
              <option value="REJECTED">abgelehnt</option>
              <option value="PENDING">wird überprüft</option>
            </select>
          </div>
          {absLoading || loading ? (
            <div>Lade Abwesenheiten...</div>
          ) : (
            <div style={{ maxHeight: "340px", overflowY: "auto", marginBottom: "1em", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
              <table className="dashboard-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th>Mitarbeiter</th>
                    <th>Art</th>
                    <th>Start</th>
                    <th>Ende</th>
                    <th>Status</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {absences
                    .filter(a => (absenceStatusFilter && absenceStatusFilter !== 'ALLE' ? a.status === absenceStatusFilter : true))
                    .map((a) => {
                    const user = users.find((u) => u.id === a.userId);
                    return (
                      <tr key={a.id}>
                        <td>{user ? user.username : "-"}</td>
                        <td>{a.type}</td>
                        <td>{a.startDate}</td>
                        <td>{a.endDate}</td>
                        <td>{a.status === "APPROVED" ? "genehmigt" : a.status === "PENDING" ? "wird überprüft" : a.status === "REJECTED" ? "abgelehnt" : a.status}</td>
                        <td style={{ display: "flex", gap: 8 }}>
                          {a.status === "PENDING" && <button className="btn-primary" onClick={() => handleApproveAbsence(a)}>Genehmigen</button>}
                          {a.status === "PENDING" && <button className="btn-danger" onClick={() => handleRejectAbsence(a)}>Ablehnen</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
