package de.zeiterfassung.controller;

import de.zeiterfassung.model.AbsenceAllowance;
import de.zeiterfassung.repository.AbsenceAllowanceRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/allowances")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AllowanceController {

    private final AbsenceAllowanceRepository repo;

    public AllowanceController(AbsenceAllowanceRepository repo){ this.repo = repo; }

    @GetMapping("/{year}")
    public List<AbsenceAllowance> listYear(@PathVariable int year){
        return repo.findByYear(year);
    }

    @GetMapping("/{year}/user/{userId}")
    public List<AbsenceAllowance> listUserYear(@PathVariable int year, @PathVariable Long userId){
        return repo.findByUserIdAndYear(userId, year);
    }

    @PutMapping("/{year}/user/{userId}")
    public Map<String, Object> upsertUserYear(@PathVariable int year, @PathVariable Long userId, @RequestBody Map<String, Integer> body){
        // body: { "Urlaub": 30, "Krank": 0, "Sonderurlaub": 0 }
        String[] types = new String[]{"Urlaub","Krank","Sonderurlaub"};
        Map<String,Object> res = new HashMap<>();
        for(String t: types){
            int days = Math.max(0, body.getOrDefault(t, 0));
            AbsenceAllowance a = repo.findByUserIdAndTypeAndYear(userId, t, year)
                    .orElse(new AbsenceAllowance(userId, t, year, days));
            a.setDays(days);
            repo.save(a);
            res.put(t, days);
        }
        return res;
    }

    @DeleteMapping("/{year}/user/{userId}")
    public void clearUserYear(@PathVariable int year, @PathVariable Long userId){
        List<AbsenceAllowance> list = repo.findByUserIdAndYear(userId, year);
        repo.deleteAll(list);
    }
}
