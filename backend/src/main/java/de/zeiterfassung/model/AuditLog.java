package de.zeiterfassung.model;

import javax.persistence.*;

@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String ts;
    @Column(name = "admin_username")
    private String adminUsername;
    private String action;
    @Column(name = "target_type")
    private String targetType;
    @Column(name = "target_id")
    private Long targetId;
    private String details;

    public AuditLog() {}

    public AuditLog(String ts, String adminUsername, String action, String targetType, Long targetId, String details) {
        this.ts = ts; this.adminUsername = adminUsername; this.action = action; this.targetType = targetType; this.targetId = targetId; this.details = details;
    }

    public Long getId() { return id; }
    public String getTs() { return ts; }
    public void setTs(String ts) { this.ts = ts; }
    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
