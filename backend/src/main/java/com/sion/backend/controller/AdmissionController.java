package com.sion.backend.controller;

import com.sion.backend.dto.request.AdmissionRequest;
import com.sion.backend.dto.response.AdmissionResponse;
import com.sion.backend.dto.response.PaginatedResponse;
import com.sion.backend.model.AdmissionResult;
import com.sion.backend.model.User;
import com.sion.backend.service.AdmissionService;
import com.sion.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/admissions")
@RequiredArgsConstructor
public class AdmissionController {

    private final AdmissionService admissionService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdmissionResponse> create(@Valid @RequestBody AdmissionRequest request) {
        AdmissionResult result = admissionService.create(request);
        return ResponseEntity.ok(AdmissionResponse.fromAdmission(result));
    }

    @GetMapping("/me")
    public ResponseEntity<AdmissionResponse> getMyResult(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        AdmissionResult result = admissionService.findByUserId(user.getId());
        return ResponseEntity.ok(AdmissionResponse.fromAdmission(result));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<AdmissionResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String decision) {
        Page<AdmissionResult> results = admissionService.findAll(page, limit, decision);
        var response = results.getContent().stream()
                .map(AdmissionResponse::fromAdmission).toList();
        return ResponseEntity.ok(new PaginatedResponse<>(
                response, page, limit, results.getTotalElements(), results.getTotalPages()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdmissionResponse> getById(@PathVariable String id) {
        AdmissionResult result = admissionService.findById(id);
        return ResponseEntity.ok(AdmissionResponse.fromAdmission(result));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdmissionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody AdmissionRequest request) {
        AdmissionResult result = admissionService.update(id, request);
        return ResponseEntity.ok(AdmissionResponse.fromAdmission(result));
    }
}
