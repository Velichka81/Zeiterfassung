package de.zeiterfassung.repository;

import de.zeiterfassung.model.Absence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, Long> {
	List<Absence> findByUserIdOrderByStartDateDesc(Long userId);
	List<Absence> findAllByOrderByStartDateDesc();
}
