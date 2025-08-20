package de.zeiterfassung.repository;

import de.zeiterfassung.model.AbsenceAllowance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface AbsenceAllowanceRepository extends JpaRepository<AbsenceAllowance, Long> {
    List<AbsenceAllowance> findByUserIdAndYear(Long userId, int year);
    List<AbsenceAllowance> findByYear(int year);
    Optional<AbsenceAllowance> findByUserIdAndTypeAndYear(Long userId, String type, int year);

    @Query("select coalesce(sum(a.days),0) from AbsenceAllowance a where a.type = ?1 and a.year = ?2")
    int sumDaysByTypeAndYear(String type, int year);
}
