package de.zeiterfassung.controller;

import de.zeiterfassung.model.WorkSession;
import de.zeiterfassung.model.AppUser;
import de.zeiterfassung.repository.WorkSessionRepository;
import de.zeiterfassung.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import de.zeiterfassung.dto.WorkSessionDTO;

@RestController
@RequestMapping("/api/worksessions")
public class WorkSessionController {
    @Autowired
    private WorkSessionRepository workSessionRepository;

    @Autowired
    private UserRepository userRepository;
    // Projekte entfernt: kein ProjectRepository mehr

    private AppUser requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nicht angemeldet");
        }
        String username = auth.getName();
        if (username == null || username.equalsIgnoreCase("anonymousUser")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nicht angemeldet");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User nicht gefunden"));
    }

    // User: Eigene Sessions sehen
    @GetMapping("/me")
    public List<WorkSession> getMySessions() {
        AppUser user = requireCurrentUser();
        System.out.println("[WorkSessionController] getMySessions: user=" + user.getUsername());
        return workSessionRepository.findByUser(user);
    }

    // Admin: Alle Sessions sehen
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<WorkSessionDTO> getAll() {
        return workSessionRepository.findAll().stream()
            .map(ws -> new WorkSessionDTO(
                ws.getId(),
                ws.getUser() != null ? ws.getUser().getId() : null,
                ws.getUser() != null ? ws.getUser().getUsername() : null,
                ws.getUser() != null ? ws.getUser().getImageUrl() : null,
                ws.getStartTime(),
                ws.getEndTime(),
                ws.getPauseSeconds(),
                ws.isPauseActive(),
                ws.getCreatedAt(),
                ws.getUpdatedAt(),
                ws.getStatus()
            ))
            .collect(Collectors.toList());
    }
    // (kein generisches create/update – Start/Stop/Pause/Bestätigen verwenden)

    // User: Neue Session starten
    @PostMapping("/start")
    public ResponseEntity<?> startSession() {
        AppUser user = requireCurrentUser();
        // Verhindern, dass eine zweite laufende Session gestartet wird
        if (workSessionRepository.findFirstByUserIdAndEndTimeIsNullOrderByStartTimeDesc(user.getId()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Es läuft bereits eine Session");
        }
        WorkSession ws = new WorkSession();
    ws.setUser(user);
    ws.setStartTime(LocalDateTime.now());
    ws.setPauseSeconds(0);
    ws.setPauseActive(false); // Pausenstatus immer auf false beim Start
    ws.setCreatedAt(LocalDateTime.now());
    ws.setUpdatedAt(LocalDateTime.now());
    workSessionRepository.save(ws);
    return ResponseEntity.ok(ws);
    }

    // User: Session stoppen
    @PostMapping("/stop/{id}")
    public ResponseEntity<?> stopSession(@PathVariable Long id) {
        AppUser user = requireCurrentUser();
        Optional<WorkSession> opt = workSessionRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        WorkSession ws = opt.get();
        if (!ws.getUser().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        ws.setEndTime(LocalDateTime.now());
        ws.setUpdatedAt(LocalDateTime.now());
        workSessionRepository.save(ws);
        return ResponseEntity.ok(ws);
    }

    // User: Pause starten/beenden (toggle)
    @PostMapping("/pause/{id}")
    public ResponseEntity<?> pauseSession(@PathVariable Long id, @RequestParam boolean pause, @RequestParam int seconds) {
        AppUser user = requireCurrentUser();
        Optional<WorkSession> opt = workSessionRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        WorkSession ws = opt.get();
        if (!ws.getUser().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
    ws.setPauseSeconds(seconds);
    ws.setPauseActive(pause);
        ws.setUpdatedAt(LocalDateTime.now());
        workSessionRepository.save(ws);
        return ResponseEntity.ok(ws);
    }

    // Admin: Session ändern oder bestätigen
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateSession(@PathVariable Long id, @RequestBody WorkSession update) {
        Optional<WorkSession> opt = workSessionRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        WorkSession ws = opt.get();
        if (update.getStartTime() != null) ws.setStartTime(update.getStartTime());
        if (update.getEndTime() != null) ws.setEndTime(update.getEndTime());
        ws.setPauseSeconds(update.getPauseSeconds());
        if (update.getStatus() != null) ws.setStatus(update.getStatus());
        ws.setUpdatedAt(LocalDateTime.now());
        workSessionRepository.save(ws);
        return ResponseEntity.ok(ws);
    }
}
