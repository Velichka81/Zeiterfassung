package de.zeiterfassung.controller;

import de.zeiterfassung.model.Project;
import de.zeiterfassung.model.ProjectAssignment;
import de.zeiterfassung.repository.ProjectRepository;
import de.zeiterfassung.repository.ProjectAssignmentRepository;
import de.zeiterfassung.repository.UserRepository;
import de.zeiterfassung.model.AppUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Optional;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private static final Set<String> ALLOWED_ROLES = new HashSet<>(Arrays.asList("member","manager"));
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private ProjectAssignmentRepository assignmentRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Project> getAll() {
        return projectRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Project> get(@PathVariable Long id) {
        return projectRepository.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Project create(@RequestBody Project p) {
        return projectRepository.save(p);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Project update(@PathVariable Long id, @RequestBody Project p) {
        p.setId(id);
        return projectRepository.save(p);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        projectRepository.deleteById(id);
    }

    // --- Assignments ---
    @GetMapping("/{id}/assignments")
    public ResponseEntity<List<ProjectAssignment>> getAssignments(@PathVariable Long id) {
        if (!projectRepository.existsById(id)) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(assignmentRepository.findByProjectId(id));
    }

    @PostMapping("/{id}/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assign(@PathVariable Long id, @RequestBody ProjectAssignment a) {
        var projectOpt = projectRepository.findById(id);
        if (projectOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Projekt nicht gefunden");
        // User aus Payload ziehen: erwartet { user: { id: <id> }, role: "member" }
        if (a.getUser() == null || a.getUser().getId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User-ID erforderlich");
        }
        Optional<AppUser> userOpt = userRepository.findById(a.getUser().getId());
        if (userOpt.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User nicht gefunden");
        var project = projectOpt.get();
        var user = userOpt.get();
        // Duplikate verhindern
        if (assignmentRepository.existsByProjectIdAndUser_Id(project.getId(), user.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Benutzer ist dem Projekt bereits zugewiesen");
        }
        // Rolle validieren (default: member)
        String role = a.getRole();
        if (role == null) role = "member";
        if (!ALLOWED_ROLES.contains(role)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Ungültige Rolle");
        }
        a.setProject(project);
        a.setUser(user);
        a.setRole(role);
        var saved = assignmentRepository.save(a);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeAssignment(@PathVariable Long assignmentId) {
        if (!assignmentRepository.existsById(assignmentId)) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        assignmentRepository.deleteById(assignmentId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAssignmentRole(@PathVariable Long assignmentId, @RequestBody ProjectAssignment body) {
        var opt = assignmentRepository.findById(assignmentId);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Zuweisung nicht gefunden");
        var pa = opt.get();
        if (body.getRole() != null) {
            if (!ALLOWED_ROLES.contains(body.getRole())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Ungültige Rolle");
            }
            pa.setRole(body.getRole());
        }
        var saved = assignmentRepository.save(pa);
        return ResponseEntity.ok(saved);
    }
}
