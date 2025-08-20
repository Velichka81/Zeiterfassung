package de.zeiterfassung.model;

import de.zeiterfassung.persistence.LocalDateAttributeConverter;
import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "absence")
public class Absence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ISO Datum (yyyy-MM-dd)
    @Column(name = "start_date")
    @Convert(converter = LocalDateAttributeConverter.class)
    private LocalDate startDate;

    @Column(name = "end_date")
    @Convert(converter = LocalDateAttributeConverter.class)
    private LocalDate endDate;

    // Urlaub, Krankheit, Sonderurlaub
    @Column(name = "type")
    private String type;

    @Column(name = "note")
    private String note;

    @Column(name = "has_atest")
    private boolean hasATest;

    // Workflow
    @Column(name = "status")
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private String approvedAt; // store ISO datetime as TEXT for simplicity

    @Column(name = "user_id")
    private Long userId;

    public Absence() {}

    public Absence(LocalDate startDate, LocalDate endDate, String type, String note) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.type = type;
        this.note = note;
    }

    public Long getId() { return id; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public boolean isHasATest() { return hasATest; }
    public void setHasATest(boolean hasATest) { this.hasATest = hasATest; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public String getApprovedAt() { return approvedAt; }
    public void setApprovedAt(String approvedAt) { this.approvedAt = approvedAt; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
