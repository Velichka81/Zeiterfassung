package de.zeiterfassung.repository;

import de.zeiterfassung.model.WorkSession;
import de.zeiterfassung.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkSessionRepository extends JpaRepository<WorkSession, Long> {
    List<WorkSession> findByUser(AppUser user);
    List<WorkSession> findByUserId(Long userId);
    Optional<WorkSession> findFirstByUserIdAndEndTimeIsNullOrderByStartTimeDesc(Long userId);
}
