package com.sion.backend.controller;

import com.sion.backend.dto.request.GoalRequest;
import com.sion.backend.dto.response.GoalResponse;
import com.sion.backend.dto.response.MessageResponse;
import com.sion.backend.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<GoalResponse>> getAll() {
        List<GoalResponse> goals = goalService.findAll().stream()
                .map(GoalResponse::fromGoal)
                .toList();
        return ResponseEntity.ok(goals);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GoalResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(GoalResponse.fromGoal(goalService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GoalResponse> create(@Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(GoalResponse.fromGoal(goalService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GoalResponse> update(
            @PathVariable String id,
            @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(GoalResponse.fromGoal(goalService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> delete(@PathVariable String id) {
        goalService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Meta eliminada"));
    }
}
