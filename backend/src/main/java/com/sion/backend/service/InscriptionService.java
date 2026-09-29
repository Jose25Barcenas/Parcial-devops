package com.sion.backend.service;

import com.sion.backend.dto.request.InscriptionRequest;
import com.sion.backend.dto.response.InscriptionResponse;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.model.Inscription;
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
public class InscriptionService {

    private final InscriptionRepository inscriptionRepository;

    private static final List<String> VALID_PROGRAMS = Arrays.asList(
        "Ingenieria de Sistemas", "Ingenieria Industrial", "Administracion de Empresas",
        "Administracion Publica", "Contaduria Publica", "Enfermeria", "Teologia", "Licenciatura en Educacion"
    );

    private static final List<String> VALID_SCHEDULES = Arrays.asList(
        "Diurna", "Nocturna", "Fines de Semana"
    );

    public Inscription create(InscriptionRequest request, String userId) {
        if (!VALID_PROGRAMS.contains(request.getProgram())) {
            throw new IllegalArgumentException("Programa no valido");
        }
        if (!VALID_SCHEDULES.contains(request.getSchedule())) {
            throw new IllegalArgumentException("Jornada no valida");
        }

        Inscription inscription = new Inscription();
        inscription.setUserId(userId);
        inscription.setProgram(request.getProgram());
        inscription.setSchedule(request.getSchedule());
        inscription.setStatus("pending");
        inscription.setCreatedAt(LocalDateTime.now());
        inscription.setUpdatedAt(LocalDateTime.now());

        return inscriptionRepository.save(inscription);
    }

    public List<InscriptionResponse> findByUserId(String userId) {
        return inscriptionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(InscriptionResponse::fromInscription)
                .toList();
    }

    public Inscription findById(String id) {
        return inscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inscripcion no encontrada"));
    }

    public Page<Inscription> findAll(int page, int limit, String status) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(100, Math.max(1, limit));
        PageRequest pageRequest = PageRequest.of(safePage - 1, safeLimit);
        if (status != null && !status.isEmpty()) {
            return inscriptionRepository.findByStatus(status, pageRequest);
        }
        return inscriptionRepository.findAll(pageRequest);
    }

    public Inscription updateStatus(String id, String status) {
        if (!Arrays.asList("pending", "completed").contains(status)) {
            throw new IllegalArgumentException("Estado no valido");
        }
        Inscription inscription = findById(id);
        inscription.setStatus(status);
        inscription.setUpdatedAt(LocalDateTime.now());
        return inscriptionRepository.save(inscription);
    }
}
