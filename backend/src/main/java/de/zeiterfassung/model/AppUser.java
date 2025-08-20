package de.zeiterfassung.model;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // ADMIN or USER

    @Column(name = "locked")
    private Integer locked = 0; // 0=false, 1=true (SQLite)


    @Column(name = "image_url")
    private String imageUrl;

    // Work model
    @Column(name = "work_model")
    private String workModel; // e.g., FULLTIME, PARTTIME, or custom label

    @Column(name = "weekly_hours_minutes")
    private Integer weeklyHoursMinutes; // minutes per week (e.g., 2400=40h)

    @Column(name = "regular_days")
    private String regularDays; // e.g., MON-FRI

    @Column(name = "regular_time")
    private String regularTime; // e.g., 09:00-17:30

    public AppUser() {}

    public AppUser(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getWorkModel() { return workModel; }
    public void setWorkModel(String workModel) { this.workModel = workModel; }

    public Integer getWeeklyHoursMinutes() { return weeklyHoursMinutes; }
    public void setWeeklyHoursMinutes(Integer weeklyHoursMinutes) { this.weeklyHoursMinutes = weeklyHoursMinutes; }

    public String getRegularDays() { return regularDays; }
    public void setRegularDays(String regularDays) { this.regularDays = regularDays; }

    public String getRegularTime() { return regularTime; }
    public void setRegularTime(String regularTime) { this.regularTime = regularTime; }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    @JsonIgnore
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isLocked() { return locked != null && locked != 0; }
    public void setLocked(boolean locked) { this.locked = locked ? 1 : 0; }
}
