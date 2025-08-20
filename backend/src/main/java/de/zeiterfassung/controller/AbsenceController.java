package de.zeiterfassung.controller;

import de.zeiterfassung.model.Absence;
import de.zeiterfassung.model.AppUser;
import de.zeiterfassung.repository.AbsenceRepository;
import de.zeiterfassung.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

@RestController
@RequestMapping("/api/absences")
@CrossOrigin(origins = "*")
public class AbsenceController {
    @Autowired
    private AbsenceRepository repository;
    @Autowired
    private UserRepository users;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Object principal = auth.getPrincipal();
        String username = null;
        if (principal instanceof String) {
            username = (String) principal;
        } else if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        }
        if (username == null || username.equalsIgnoreCase("anonymousUser")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return users.findByUsername(username)
                .map(AppUser::getId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }


    // Für Admin: alle Abwesenheiten, für User: nur eigene
    @GetMapping
    public List<Absence> getAll() {
        if (isAdmin()) {
            return repository.findAllByOrderByStartDateDesc();
        } else {
            return repository.findByUserIdOrderByStartDateDesc(currentUserId());
        }
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping
    public Absence create(@RequestBody Absence a) {
        if(a.getStatus()==null||a.getStatus().isBlank()) a.setStatus("PENDING");
        a.setUserId(currentUserId());
        return repository.save(a);
    }

    @PutMapping("/{id}")
    public Absence update(@PathVariable Long id, @RequestBody Absence updated) {
        return repository.findById(id)
                .map(ex -> {
                    if (isAdmin()) {
                        // Admin darf alles setzen (inkl. Status APPROVED/REJECTED)
                        ex.setStartDate(updated.getStartDate());
                        ex.setEndDate(updated.getEndDate());
                        ex.setType(updated.getType());
                        ex.setNote(updated.getNote());
                        ex.setHasATest(updated.isHasATest());
                        ex.setStatus(updated.getStatus());
                        ex.setApprovedBy(updated.getApprovedBy());
                        ex.setApprovedAt(updated.getApprovedAt());
                        return repository.save(ex);
                    }
                    if (!ex.getUserId().equals(currentUserId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found");
                    if (!"PENDING".equalsIgnoreCase(ex.getStatus())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nur Anträge im Status PENDING bearbeitbar");
                    ex.setStartDate(updated.getStartDate());
                    ex.setEndDate(updated.getEndDate());
                    ex.setType(updated.getType());
                    ex.setNote(updated.getNote());
                    ex.setHasATest(updated.isHasATest());
                    return repository.save(ex);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found"));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Absence ex = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found"));
        if (isAdmin()) {
            repository.delete(ex);
            return;
        }
        if (!ex.getUserId().equals(currentUserId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found");
        if (!"PENDING".equalsIgnoreCase(ex.getStatus())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nur PENDING stornierbar");
        repository.delete(ex);
    }

    @PostMapping("/{id}/cancel")
    public Absence cancel(@PathVariable Long id) {
        Absence ex = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found"));
        if (!ex.getUserId().equals(currentUserId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Absence not found");
        if (!"PENDING".equalsIgnoreCase(ex.getStatus())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nur PENDING stornierbar");
        ex.setStatus("CANCELED");
        return repository.save(ex);
    }
}
