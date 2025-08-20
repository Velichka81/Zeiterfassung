package de.zeiterfassung.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
public class TimeEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime start;
    private LocalDateTime end;
    private String category;
    private String note;

    @Column(name = "user_id")
    private Long userId;

    public TimeEntry() {}

    public TimeEntry(LocalDateTime start, LocalDateTime end, String category, String note) {
        this.start = start;
        this.end = end;
        this.category = category;
        this.note = note;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getStart() { return start; }
    public void setStart(LocalDateTime start) { this.start = start; }
    public LocalDateTime getEnd() { return end; }
    public void setEnd(LocalDateTime end) { this.end = end; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
