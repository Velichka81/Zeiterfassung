package de.zeiterfassung.repository;

import de.zeiterfassung.model.ProjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {
	java.util.List<ProjectAssignment> findByProjectId(Long projectId);
	boolean existsByProjectIdAndUser_Id(Long projectId, Long userId);
}
