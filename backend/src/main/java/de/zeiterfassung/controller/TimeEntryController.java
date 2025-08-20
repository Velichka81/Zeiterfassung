package de.zeiterfassung.controller;

import de.zeiterfassung.model.TimeEntry;
import de.zeiterfassung.model.AppUser;
import de.zeiterfassung.repository.UserRepository;
import de.zeiterfassung.repository.TimeEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/entries")
@CrossOrigin(origins = "*")
public class TimeEntryController {
    @Autowired
    private TimeEntryRepository repository;
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

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping
    public List<TimeEntry> getAll() {
        if (isAdmin()) {
            return repository.findAllByOrderByStartDesc();
        }
        Long uid = currentUserId();
        return repository.findByUserIdOrderByStartDesc(uid);
    }

    @PostMapping
    public TimeEntry create(@RequestBody TimeEntry entry) {
        Long uid = currentUserId();
        if (entry.getEnd() == null && repository.existsByUserIdAndEndIsNull(uid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Es läuft bereits ein Timer");
        }
        entry.setUserId(uid);
        return repository.save(entry);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimeEntry> upsert(@PathVariable Long id, @RequestBody TimeEntry payload) {
        Long uid = currentUserId();
        Optional<TimeEntry> existingOpt = repository.findById(id);
        if (existingOpt.isPresent()) {
            TimeEntry existing = existingOpt.get();
            if (!isAdmin()) {
                if (existing.getUserId() == null || !existing.getUserId().equals(uid)) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found");
                }
            }
            existing.setStart(payload.getStart());
            existing.setEnd(payload.getEnd());
            existing.setCategory(payload.getCategory());
            existing.setNote(payload.getNote());
            if (!isAdmin()) {
                if (existing.getEnd() == null && repository.existsByUserIdAndEndIsNull(uid) && !existing.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Es läuft bereits ein Timer");
                }
            }
            TimeEntry saved = repository.save(existing);
            return ResponseEntity.ok(saved);
        } else {
            // create new entry (id will be auto-generated)
            TimeEntry neu = new TimeEntry();
            if (!isAdmin()) {
                if (payload.getEnd() == null && repository.existsByUserIdAndEndIsNull(uid)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Es läuft bereits ein Timer");
                }
            }
            neu.setStart(payload.getStart());
            neu.setEnd(payload.getEnd());
            neu.setCategory(payload.getCategory());
            neu.setNote(payload.getNote());
            if (isAdmin() && payload.getUserId() != null) {
                neu.setUserId(payload.getUserId());
            } else {
                neu.setUserId(uid);
            }
            TimeEntry saved = repository.save(neu);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Long uid = currentUserId();
        TimeEntry e = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
        if (!isAdmin()) {
            if (e.getUserId() == null || !e.getUserId().equals(uid)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found");
        }
        repository.delete(e);
    }

    // Entfernt: Timer-Hilfsmethoden (activeFor, stopActiveIfAny) – nicht mehr benötigt

    // Timer-Endpunkte wurden entfernt

    // Export CSV
    @GetMapping(value = "/export.csv", produces = "text/csv")
    public @ResponseBody String exportCsv(){
        Long uid = currentUserId();
        StringBuilder sb = new StringBuilder();
        sb.append("id,start,end,category,note\n");
        for (TimeEntry e : repository.findByUserIdOrderByStartDesc(uid)){
            sb.append(e.getId()).append(',')
              .append(e.getStart()!=null?e.getStart():"").append(',')
              .append(e.getEnd()!=null?e.getEnd():"").append(',')
              .append(e.getCategory()!=null?e.getCategory().replace(","," "):"").append(',')
              .append(e.getNote()!=null?e.getNote().replace(","," "):"")
              .append("\n");
        }
        return sb.toString();
    }
}
