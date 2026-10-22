package com.sion.backend.controller;

import com.sion.backend.dto.request.IssueCredentialRequest;
import com.sion.backend.dto.request.RevokeCredentialRequest;
import com.sion.backend.dto.response.CredentialResponse;
import com.sion.backend.dto.response.PaginatedResponse;
import com.sion.backend.dto.response.VerificationResponse;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.model.Credential;
import com.sion.backend.model.Inscription;
import com.sion.backend.model.User;
import com.sion.backend.repository.InscriptionRepository;
import com.sion.backend.repository.UserRepository;
import com.sion.backend.service.BlockchainService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API del ledger de credenciales academicas (Fase Piloto blockchain UNAC).
 *
 * Endpoints publicos (sin autenticacion) para verificacion externa via QR.
 */
@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final BlockchainService blockchainService;
    private final InscriptionRepository inscriptionRepository;
    private final UserRepository userRepository;

    /** Base publica usada para construir la URL de verificacion del QR. */
    @Value("${app.public-base-url:http://localhost:5173}")
    private String publicBaseUrl;

    /**
     * Emision manual de una credencial por parte del administrador.
     */
    @PostMapping("/issue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CredentialResponse> issue(
            @Valid @RequestBody IssueCredentialRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Inscription inscription = request.getInscriptionId() == null
                ? null
                : inscriptionRepository.findById(request.getInscriptionId())
                        .orElseThrow(() -> new ResourceNotFoundException("Inscripcion no encontrada"));

        User holder = inscription == null
                ? null
                : userRepository.findById(inscription.getUserId()).orElse(null);

        String title = titleFor(request.getType(), inscription);
        String issuedBy = userDetails != null ? userDetails.getUsername() : "admin";

        Credential credential = blockchainService.issue(
                request.getType(),
                title,
                holder != null ? holder.getFullName() : "Titular no identificado",
                "",
                holder != null ? holder.getEmail() : "",
                inscription != null ? inscription.getId() : "",
                inscription != null ? inscription.getProgram() : "",
                request.getPeriod() != null ? request.getPeriod() : "",
                issuedBy);

        return ResponseEntity.ok(CredentialResponse.fromCredential(credential, publicBaseUrl));
    }

    /**
     * Revoca una credencial anclando un bloque de revocacion en la cadena.
     */
    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CredentialResponse> revoke(
            @PathVariable String id,
            @Valid @RequestBody RevokeCredentialRequest request) {
        Credential credential = blockchainService.revoke(id, request.getReason());
        return ResponseEntity.ok(CredentialResponse.fromCredential(credential, publicBaseUrl));
    }

    /**
     * Listado paginado para el panel administrativo.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<CredentialResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String type) {
        Page<Credential> results = blockchainService.findAll(page, limit, type);
        var response = results.getContent().stream()
                .map(c -> CredentialResponse.fromCredential(c, publicBaseUrl))
                .toList();
        return ResponseEntity.ok(new PaginatedResponse<>(
                response, page, limit, results.getTotalElements(), results.getTotalPages()));
    }

    /**
     * Credenciales del usuario autenticado.
     */
    @GetMapping("/me")
    public ResponseEntity<java.util.List<CredentialResponse>> getMyCredentials(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        var list = blockchainService.findByHolderEmail(user.getEmail()).stream()
                .map(c -> CredentialResponse.fromCredential(c, publicBaseUrl))
                .toList();
        return ResponseEntity.ok(list);
    }

    /**
     * Estado general del ledger (cadena, bloques, validacion).
     */
    @GetMapping("/ledger/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> ledgerStatus() {
        return ResponseEntity.ok(blockchainService.ledgerStatus());
    }

    /**
     * Historial de bloques anonimo (solo indices y hashes).
     */
    @GetMapping("/ledger/blocks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<Map<String, Object>>> ledgerBlocks(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(blockchainService.listBlocks(limit));
    }

    /**
     * Validacion manual de la integridad de toda la cadena.
     */
    @GetMapping("/ledger/validate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> validateChain() {
        var result = blockchainService.validateChain();
        return ResponseEntity.ok(Map.of(
                "valid", result.valid(),
                "totalBlocks", result.totalBlocks(),
                "message", result.message()));
    }

    /**
     * VERIFICACION PUBLICA - no requiere autenticacion.
     * Es el endpoint al que apunta el QR impreso en el certificado.
     */
    @GetMapping("/verify/{code}")
    public ResponseEntity<VerificationResponse> verifyPublic(@PathVariable String code) {
        var result = blockchainService.verify(code.toUpperCase().trim());
        return ResponseEntity.ok(new VerificationResponse(
                result.isAuthentic(),
                result.chainValid(),
                result.contentMatches(),
                result.anchored(),
                result.totalBlocks(),
                result.chainMessage(),
                CredentialResponse.fromCredential(result.credential(), publicBaseUrl)));
    }

    /**
     * Detalle de una credencial (admin).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CredentialResponse> getById(@PathVariable String id) {
        Credential credential = blockchainService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Credencial no encontrada"));
        return ResponseEntity.ok(CredentialResponse.fromCredential(credential, publicBaseUrl));
    }

    private String titleFor(String type, Inscription inscription) {
        String program = inscription != null ? inscription.getProgram() : "Programa academico";
        return switch (type) {
            case Credential.TYPE_ACTA -> "Acta de grado - " + program;
            case Credential.TYPE_DIPLOMA -> "Diploma de " + program;
            case Credential.TYPE_CERTIFICADO -> "Certificado de notas - " + program;
            case Credential.TYPE_ADMISION -> "Carta de admision - " + program;
            default -> "Credencial academica - " + program;
        };
    }
}
