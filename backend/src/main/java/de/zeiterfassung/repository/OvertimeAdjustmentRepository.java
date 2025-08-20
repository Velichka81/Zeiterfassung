package de.zeiterfassung.repository;

import de.zeiterfassung.model.OvertimeAdjustment;
import de.zeiterfassung.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface OvertimeAdjustmentRepository extends JpaRepository<OvertimeAdjustment, Long> {
    List<OvertimeAdjustment> findByUser(AppUser user);
    List<OvertimeAdjustment> findByUserAndDateBetween(AppUser user, LocalDate start, LocalDate end);
}
