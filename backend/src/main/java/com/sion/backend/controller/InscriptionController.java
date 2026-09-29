package com.sion.backend.controller;

import com.sion.backend.dto.request.InscriptionRequest;
import com.sion.backend.dto.response.InscriptionResponse;
import com.sion.backend.dto.response.PaginatedResponse;
import com.sion.backend.model.Inscription;
import com.sion.backend.model.User;
import com.sion.backend.service.InscriptionService;
import com.sion.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/inscriptions")
@RequiredArgsConstructor
public class InscriptionController {

    private final InscriptionService inscriptionService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<InscriptionResponse> create(
            @Valid @RequestBody InscriptionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        Inscription inscription = inscriptionService.create(request, user.getId());
        return ResponseEntity.ok(InscriptionResponse.fromInscription(inscription));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyInscriptions(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(inscriptionService.findByUserId(user.getId()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<InscriptionResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status) {
        Page<Inscription> inscriptions = inscriptionService.findAll(page, limit, status);
        var response = inscriptions.getContent().stream()
                .map(InscriptionResponse::fromInscription).toList();
        return ResponseEntity.ok(new PaginatedResponse<>(
                response, page, limit, inscriptions.getTotalElements(), inscriptions.getTotalPages()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InscriptionResponse> getById(@PathVariable String id) {
        Inscription inscription = inscriptionService.findById(id);
        return ResponseEntity.ok(InscriptionResponse.fromInscription(inscription));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InscriptionResponse> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        Inscription inscription = inscriptionService.updateStatus(id, body.get("status"));
        return ResponseEntity.ok(InscriptionResponse.fromInscription(inscription));
    }
}
