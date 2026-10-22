package com.sion.backend.service;

import com.sion.backend.dto.request.AdmissionRequest;
import com.sion.backend.exception.ConflictException;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.model.AdmissionResult;
import com.sion.backend.model.Credential;
import com.sion.backend.model.Inscription;
import com.sion.backend.model.User;
import com.sion.backend.repository.AdmissionResultRepository;
import com.sion.backend.repository.InscriptionRepository;
import com.sion.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdmissionService {

    private final AdmissionResultRepository admissionResultRepository;
    private final InscriptionRepository inscriptionRepository;
    private final UserRepository userRepository;
    private final N8nService n8nService;
    private final BlockchainService blockchainService;

    private static final List<String> VALID_DECISIONS = Arrays.asList("pending", "admitted", "rejected");

    public AdmissionResult create(AdmissionRequest request) {
        if (!VALID_DECISIONS.contains(request.getDecision())) {
            throw new IllegalArgumentException("Decision no valida");
        }

        Inscription inscription = inscriptionRepository.findById(request.getInscriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Inscripcion no encontrada"));

        if (admissionResultRepository.existsByInscriptionId(request.getInscriptionId())) {
            throw new ConflictException("Ya existe un resultado de admision para esta inscripcion");
        }

        AdmissionResult result = new AdmissionResult();
        result.setInscriptionId(request.getInscriptionId());
        result.setDecision(request.getDecision());
        result.setPeriod(request.getPeriod());
        result.setNotes(request.getNotes());
        result.setEvaluatedAt(LocalDateTime.now());

        AdmissionResult saved = admissionResultRepository.save(result);
        notifyAdmission(saved, inscription);
        if ("admitted".equals(saved.getDecision())) {
            issueAdmissionCredential(saved, inscription);
        }
        return saved;
    }

    /**
     * Fase Piloto blockchain: al admitir se emite automaticamente la carta de
     * admision como credencial verificable anclada en el ledger (solo hash).
     */
    private void issueAdmissionCredential(AdmissionResult result, Inscription inscription) {
        try {
            if (inscription != null && blockchainService.findById(inscription.getId()).isPresent()) {
                return;
            }
            var owner = inscription == null
                    ? java.util.Optional.<User>empty()
                    : userRepository.findById(inscription.getUserId());

            Credential credential = blockchainService.issue(
                    Credential.TYPE_ADMISION,
                    "Carta de admision - " + (inscription != null ? inscription.getProgram() : ""),
                    owner.map(User::getFullName).orElse("Titular no identificado"),
                    "",
                    owner.map(User::getEmail).orElse(""),
                    inscription != null ? inscription.getId() : "",
                    inscription != null ? inscription.getProgram() : "",
                    result.getPeriod() != null ? result.getPeriod() : "",
                    "comite-admision");

            n8nService.sendCredentialIssued(java.util.Map.of(
                    "credentialId", credential.getId(),
                    "verificationCode", credential.getVerificationCode(),
                    "type", credential.getType(),
                    "email", credential.getHolderEmail(),
                    "name", credential.getHolderName(),
                    "program", credential.getProgram(),
                    "verificationUrl", credential.getVerificationCode(),
                    "issuedAt", String.valueOf(credential.getIssuedAt())
            ));
        } catch (Exception e) {
            // La emision de credencial no debe romper la decision de admision.
            log.warn("[blockchain] No se pudo emitir la credencial de admision: {}", e.getMessage());
        }
    }

    private void notifyAdmission(AdmissionResult result, Inscription inscription) {
        java.util.Optional<User> owner = inscription == null
                ? java.util.Optional.empty()
                : userRepository.findById(inscription.getUserId());
        n8nService.sendAdmissionDecided(java.util.Map.of(
                "admissionId", result.getId(),
                "inscriptionId", result.getInscriptionId(),
                "decision", result.getDecision(),
                "period", result.getPeriod() != null ? result.getPeriod() : "",
                "notes", result.getNotes() != null ? result.getNotes() : "",
                "evaluatedAt", String.valueOf(result.getEvaluatedAt()),
                "email", owner.map(User::getEmail).orElse(""),
                "name", owner.map(User::getFullName).orElse(""),
                "program", inscription != null ? inscription.getProgram() : ""
        ));
    }

    public AdmissionResult findByUserId(String userId) {
        List<Inscription> inscriptions = inscriptionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (inscriptions.isEmpty()) {
            throw new ResourceNotFoundException("No se encontraron inscripciones");
        }

        for (Inscription inscription : inscriptions) {
            var result = admissionResultRepository.findByInscriptionId(inscription.getId());
            if (result.isPresent()) {
                return result.get();
            }
        }
        throw new ResourceNotFoundException("Resultado de admision no encontrado");
    }

    public AdmissionResult findById(String id) {
        return admissionResultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resultado no encontrado"));
    }

    public Page<AdmissionResult> findAll(int page, int limit, String decision) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(100, Math.max(1, limit));
        PageRequest pageRequest = PageRequest.of(safePage - 1, safeLimit);
        if (decision != null && !decision.isEmpty()) {
            return admissionResultRepository.findByDecision(decision, pageRequest);
        }
        return admissionResultRepository.findAll(pageRequest);
    }

    public AdmissionResult update(String id, AdmissionRequest request) {
        AdmissionResult result = findById(id);

        if (request.getDecision() != null) {
            if (!VALID_DECISIONS.contains(request.getDecision())) {
                throw new IllegalArgumentException("Decision no valida");
            }
            result.setDecision(request.getDecision());
        }
        if (request.getPeriod() != null) result.setPeriod(request.getPeriod());
        if (request.getNotes() != null) result.setNotes(request.getNotes());
        result.setEvaluatedAt(LocalDateTime.now());

        AdmissionResult saved = admissionResultRepository.save(result);

        var inscription = inscriptionRepository.findById(saved.getInscriptionId()).orElse(null);
        notifyAdmission(saved, inscription);
        return saved;
    }
}
