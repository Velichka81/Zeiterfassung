package de.zeiterfassung.model;

import javax.persistence.*;

@Entity
@Table(name = "absence_allowance", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","type","year"}))
public class AbsenceAllowance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Urlaub, Krank, Sonderurlaub
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "year", nullable = false)
    private int year;

    @Column(name = "days", nullable = false)
    private int days;

    public AbsenceAllowance() {}

    public AbsenceAllowance(Long userId, String type, int year, int days) {
        this.userId = userId; this.type = type; this.year = year; this.days = days;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public int getDays() { return days; }
    public void setDays(int days) { this.days = days; }
}
