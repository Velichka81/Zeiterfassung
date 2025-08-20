package de.zeiterfassung.controller;

import de.zeiterfassung.model.OvertimeAdjustment;
import de.zeiterfassung.model.AppUser;
import de.zeiterfassung.repository.OvertimeAdjustmentRepository;
import de.zeiterfassung.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/overtime")
public class OvertimeController {
    @Autowired private OvertimeAdjustmentRepository repo;
    @Autowired private UserRepository users;

    private AppUser requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        String username = auth.getName();
        if (username == null || username.equalsIgnoreCase("anonymousUser")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return users.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping("/adjustments")
    public List<OvertimeAdjustment> myAdjustments(@RequestParam(name = "userId", required = false) Long userId) {
        AppUser u;
        if (userId != null && isAdmin()) {
            u = users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        } else {
            u = requireCurrentUser();
        }
        return repo.findByUser(u);
    }

    @PostMapping("/adjustments")
    public OvertimeAdjustment add(@RequestBody Map<String, Object> payload) {
        AppUser u = isAdmin() && payload.get("userId") != null ?
                users.findById(Long.valueOf(payload.get("userId").toString())).orElse(requireCurrentUser()) :
                requireCurrentUser();
        OvertimeAdjustment adj = new OvertimeAdjustment();
        adj.setUser(u);
        if (payload.get("date") != null) adj.setDate(LocalDate.parse(payload.get("date").toString()));
        adj.setMinutes(Integer.parseInt(payload.get("minutes").toString()));
        adj.setType(payload.get("type").toString());
        adj.setNote(payload.get("note") != null ? payload.get("note").toString() : null);
        return repo.save(adj);
    }

    @DeleteMapping("/adjustments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        AppUser me = requireCurrentUser();
        OvertimeAdjustment adj = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!isAdmin() && (adj.getUser() == null || !adj.getUser().getId().equals(me.getId()))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        repo.delete(adj);
    }
}
