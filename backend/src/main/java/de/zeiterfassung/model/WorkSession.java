package de.zeiterfassung.model;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import de.zeiterfassung.persistence.LocalDateTimeAttributeConverter;
import java.time.LocalDateTime;

@Entity
public class WorkSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private AppUser user;

    @Convert(converter = LocalDateTimeAttributeConverter.class)
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Convert(converter = LocalDateTimeAttributeConverter.class)
    @Column(name = "end_time")
    private LocalDateTime endTime;
    @Column(name = "pause_seconds")
    private int pauseSeconds;
    @Column(name = "pause_active")
    private boolean pauseActive = false;
    public boolean isPauseActive() { return pauseActive; }
    public void setPauseActive(boolean pauseActive) { this.pauseActive = pauseActive; }
    @Convert(converter = LocalDateTimeAttributeConverter.class)
    @Column(name = "created_at")
    private LocalDateTime createdAt;


    @Convert(converter = LocalDateTimeAttributeConverter.class)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "status", nullable = false)
    private String status = "unbest\u00e4tigt";

    // Getter/Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public int getPauseSeconds() { return pauseSeconds; }
    public void setPauseSeconds(int pauseSeconds) { this.pauseSeconds = pauseSeconds; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
