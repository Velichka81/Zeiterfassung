package de.zeiterfassung.dto;

import java.time.LocalDateTime;

public class WorkSessionDTO {
    private Long id;
    private Long userId;
    private String username;
    private String imageUrl;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int pauseSeconds;
    private boolean pauseActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String status;

    public WorkSessionDTO(Long id, Long userId, String username, String imageUrl, LocalDateTime startTime, LocalDateTime endTime, int pauseSeconds, boolean pauseActive, LocalDateTime createdAt, LocalDateTime updatedAt, String status) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.imageUrl = imageUrl;
        this.startTime = startTime;
        this.endTime = endTime;
        this.pauseSeconds = pauseSeconds;
        this.pauseActive = pauseActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.status = status;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getImageUrl() { return imageUrl; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public int getPauseSeconds() { return pauseSeconds; }
    public boolean isPauseActive() { return pauseActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getStatus() { return status; }
}
