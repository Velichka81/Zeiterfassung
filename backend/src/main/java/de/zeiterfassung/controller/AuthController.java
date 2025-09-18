package de.zeiterfassung.controller;

import de.zeiterfassung.model.AppUser;
import de.zeiterfassung.repository.UserRepository;
import de.zeiterfassung.security.JwtService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
// imports bereinigt
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    // entfernt: authManager war ungenutzt

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "").trim();
        String password = body.getOrDefault("password", "");
        if (username.isEmpty() || password.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ungültige Eingaben");
        }
        if (users.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Benutzer existiert bereits");
        }
        AppUser u = new AppUser(username, encoder.encode(password), "USER");
        users.save(u);
        String token = jwt.createToken(u.getUsername(), u.getRole());
        return Map.of(
            "token", token,
            "username", u.getUsername(),
            "role", u.getRole(),
            "user_id", u.getId()
        );
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "").trim();
        String password = body.getOrDefault("password", "");
        AppUser u = users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login fehlgeschlagen"));
        if (u.isLocked()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Konto gesperrt");
        if (!encoder.matches(password, u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login fehlgeschlagen");
        }
        String token = jwt.createToken(u.getUsername(), u.getRole());
        return Map.of(
                "token", token,
                "username", u.getUsername(),
                "role", u.getRole(),
                "user_id", u.getId()
        );
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestHeader(name = "Authorization", required = false) String authz) {
        if (authz == null || !authz.startsWith("Bearer ")) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        var claims = jwt.parse(authz.substring(7));
        String username = claims.getSubject();
        AppUser u = users.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Map<String,Object> m = new HashMap<>();
        m.put("username", u.getUsername());
        m.put("role", u.getRole());
        m.put("user_id", u.getId());
        m.put("imageUrl", u.getImageUrl());
        return m;
    }

    @Bean
    ApplicationRunner ensureAdmin(UserRepository users, PasswordEncoder encoder) {
        return args -> {
            String adminUser = System.getenv().getOrDefault("APP_ADMIN_USER", "admin");
            String adminPass = System.getenv().getOrDefault("APP_ADMIN_PASS", "admin123");
            if (!users.existsByUsername(adminUser)) {
                AppUser admin = new AppUser(adminUser, encoder.encode(adminPass), "ADMIN");
                users.save(admin);
            }
        };
    }
}
