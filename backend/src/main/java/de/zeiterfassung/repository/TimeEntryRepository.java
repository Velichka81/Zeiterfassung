package de.zeiterfassung.repository;

import de.zeiterfassung.model.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
	List<TimeEntry> findByUserIdOrderByStartDesc(Long userId);
	List<TimeEntry> findAllByOrderByStartDesc();
	boolean existsByUserIdAndEndIsNull(Long userId);
	Optional<TimeEntry> findFirstByUserIdAndEndIsNullOrderByStartDesc(Long userId);
}
