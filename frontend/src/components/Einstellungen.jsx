import React from "react";

export default function Einstellungen() {
  return (
    <div className="dashboard-card" style={{maxWidth:600,margin:"2em auto",padding:"2em"}}>
      <h2 style={{color:"var(--color-accent)",marginBottom:"1em"}}>Einstellungen</h2>
      <div style={{color:"var(--color-text)",fontSize:"1.1em"}}>
        Hier können später persönliche Einstellungen vorgenommen werden.
      </div>
    </div>
  );
}
