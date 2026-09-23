package com.sion.backend.service;

import com.sion.backend.dto.request.AdmissionRequest;
import com.sion.backend.exception.ConflictException;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.model.AdmissionResult;
import com.sion.backend.model.Inscription;
import com.sion.backend.repository.AdmissionResultRepository;
import com.sion.backend.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdmissionService {

    private final AdmissionResultRepository admissionResultRepository;
    private final InscriptionRepository inscriptionRepository;

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

        return admissionResultRepository.save(result);
    }

    public AdmissionResult findByUserId(String userId) {
        List<Inscription> inscriptions = inscriptionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (inscriptions.isEmpty()) {
            throw new ResourceNotFoundException("No se encontraron inscripciones");
        }

        Inscription latest = inscriptions.get(0);
        return admissionResultRepository.findByInscriptionId(latest.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Resultado de admision no encontrado"));
    }

    public AdmissionResult findById(String id) {
        return admissionResultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resultado no encontrado"));
    }

    public Page<AdmissionResult> findAll(int page, int limit, String decision) {
        PageRequest pageRequest = PageRequest.of(page - 1, limit);
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

        return admissionResultRepository.save(result);
    }
}
