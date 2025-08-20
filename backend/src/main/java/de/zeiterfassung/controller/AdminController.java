
    // ...existing code...


package de.zeiterfassung.controller;

import de.zeiterfassung.model.AppUser;
import de.zeiterfassung.model.Absence;
import de.zeiterfassung.model.AuditLog;
import de.zeiterfassung.repository.UserRepository;
import de.zeiterfassung.repository.AbsenceRepository;
import de.zeiterfassung.repository.AuditLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    @PutMapping("/users/{id}")
    public AppUser updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AppUser u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String username = body.getOrDefault("username", "").trim();
        if (!username.isEmpty() && !username.equals(u.getUsername())) {
            if (users.existsByUsername(username)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Benutzername existiert bereits");
            u.setUsername(username);
        }
        AppUser saved = users.save(u);
        log("UPDATE_USER", "USER", id, "username=" + username);
        return saved;
    }
    private final UserRepository users;
    private final AbsenceRepository absences;
    private final AuditLogRepository audit;
    private final PasswordEncoder encoder;
    private final java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads");
    private static final long MAX_FILE_SIZE = 2L * 1024 * 1024; // 2 MB

    public AdminController(UserRepository users, AbsenceRepository absences, AuditLogRepository audit, PasswordEncoder encoder) {
        this.users = users; this.absences = absences; this.audit = audit; this.encoder = encoder;
        try {
            java.nio.file.Files.createDirectories(uploadDir);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    @GetMapping("/users")
    public List<AppUser> listUsers() { return users.findAll(); }

    @PostMapping("/users")
    public AppUser createUser(@RequestBody Map<String,String> body){
        String username = body.getOrDefault("username",""), password = body.getOrDefault("password",""), role = body.getOrDefault("role","USER");
        if(username.isBlank()||password.length()<4) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if(users.existsByUsername(username)) throw new ResponseStatusException(HttpStatus.CONFLICT);
        AppUser u = new AppUser(username, encoder.encode(password), role.toUpperCase());
        AppUser saved = users.save(u);
        log("CREATE_USER", "USER", saved.getId(), "create "+username+" role="+role);
        return saved;
    }

    @PutMapping("/users/{id}/role")
    public AppUser setRole(@PathVariable Long id, @RequestBody Map<String,String> body){
        String role = body.getOrDefault("role","USER").toUpperCase();
        AppUser u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if("USER".equals(role) && "ADMIN".equals(u.getRole())){
            long admins = users.findAll().stream().filter(x->"ADMIN".equals(x.getRole())).count();
            if(admins<=1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Letzte Admin-Rolle kann nicht entzogen werden");
        }
        u.setRole(role);
        AppUser saved = users.save(u);
        log("SET_ROLE","USER", saved.getId(), "role="+role);
        return saved;
    }

    @PutMapping("/users/{id}/work-model")
    public AppUser setWorkModel(@PathVariable Long id, @RequestBody Map<String, Object> body){
        AppUser u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String workModel = body.getOrDefault("workModel", "") instanceof String ? (String) body.get("workModel") : null;
        Integer weekly = null;
        try {
            Object w = body.get("weeklyHoursMinutes");
            if (w instanceof Number) weekly = ((Number) w).intValue();
            else if (w instanceof String && !((String) w).isBlank()) weekly = Integer.parseInt((String) w);
        } catch (Exception ignored) {}
        String days = body.getOrDefault("regularDays", "") instanceof String ? (String) body.get("regularDays") : null;
        String time = body.getOrDefault("regularTime", "") instanceof String ? (String) body.get("regularTime") : null;
        if (workModel != null) u.setWorkModel(workModel);
        if (weekly != null) u.setWeeklyHoursMinutes(weekly);
        if (days != null) u.setRegularDays(days);
        if (time != null) u.setRegularTime(time);
        AppUser saved = users.save(u);
        log("SET_WORK_MODEL","USER", id, "model="+workModel+", weekly="+weekly+", days="+days+", time="+time);
        return saved;
    }

    @PutMapping("/users/{id}/password")
    public AppUser resetPassword(@PathVariable Long id, @RequestBody Map<String,String> body){
        String password = body.getOrDefault("password","");
        if(password.length()<4) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        AppUser u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        u.setPassword(encoder.encode(password));
        AppUser saved = users.save(u);
        log("RESET_PASSWORD","USER", id, null);
        return saved;
    }

    @PutMapping("/users/{id}/lock")
    public AppUser setLocked(@PathVariable Long id, @RequestParam boolean locked){
        AppUser u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // Guard: nicht letzte Admin komplett aussperren
        if(locked && "ADMIN".equals(u.getRole())){
            long admins = users.findAll().stream().filter(x->"ADMIN".equals(x.getRole()) && !x.isLocked()).count();
            if(admins<=1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Letzten aktiven Admin kann man nicht sperren");
        }
        u.setLocked(locked);
        AppUser saved = users.save(u);
        log("SET_LOCK","USER", id, "locked="+locked);
        return saved;
    }

    @PutMapping("/absences/{id}/approve")
    public Absence approve(@PathVariable Long id){
        Absence a = absences.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        a.setStatus("APPROVED");
        a.setApprovedAt(LocalDateTime.now().toString());
        a.setApprovedBy("admin");
        Absence saved = absences.save(a);
        log("APPROVE_ABSENCE","ABSENCE", id, null);
        return saved;
    }

    @PutMapping("/absences/{id}/reject")
    public Absence reject(@PathVariable Long id){
        Absence a = absences.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        a.setStatus("REJECTED");
        a.setApprovedAt(LocalDateTime.now().toString());
        a.setApprovedBy("admin");
        Absence saved = absences.save(a);
        log("REJECT_ABSENCE","ABSENCE", id, null);
        return saved;
    }

    @PutMapping("/users/{id}/image")
    public AppUser setImage(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String imageUrl = body.getOrDefault("imageUrl", "");
        AppUser u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        u.setImageUrl(imageUrl);
        AppUser saved = users.save(u);
        log("SET_IMAGE", "USER", id, imageUrl);
        return saved;
    }

    @PostMapping("/users/{id}/image")
    public AppUser uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file");
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File too large");
        }
    String contentTypeRaw = file.getContentType();
    String contentType = contentTypeRaw != null ? contentTypeRaw.toLowerCase() : "";
    if (!(contentType.contains("jpeg") || contentType.contains("jpg") || contentType.contains("png") || contentType.contains("svg"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file type");
        }
        AppUser u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    String original = file.getOriginalFilename();
    if (original == null) original = "upload";
    String ext = "";
    int i = original.lastIndexOf('.');
    if (i >= 0) ext = original.substring(i);
        String filename = "user_" + id + "_" + System.currentTimeMillis() + ext;
        java.nio.file.Path dest = uploadDir.resolve(filename);
        try {
            java.nio.file.Files.copy(file.getInputStream(), dest, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save file");
        }
        String imageUrl = "/api/admin/uploads/" + filename;
        u.setImageUrl(imageUrl);
        AppUser saved = users.save(u);
        log("UPLOAD_IMAGE", "USER", id, filename);
        return saved;
    }

    @GetMapping("/uploads/{filename:.+}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Resource> serveUpload(@PathVariable String filename) {
        try {
            java.nio.file.Path file = uploadDir.resolve(filename);
            if (!java.nio.file.Files.exists(file)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            Resource resource = new UrlResource(file.toUri());
            String type = java.nio.file.Files.probeContentType(file);
            if (type == null) type = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(type))
                    .body(resource);
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not serve file");
        }
    }

    private void log(String action, String targetType, Long id, String details){
        String admin = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null ?
                String.valueOf(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal()) : "admin";
        audit.save(new AuditLog(LocalDateTime.now().toString(), admin, action, targetType, id, details));
    }
}
