package com.sion.backend.service;

import com.sion.backend.dto.request.GoalRequest;
import com.sion.backend.exception.ConflictException;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.model.Goal;
import com.sion.backend.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    public static final List<String> VALID_KEYS = Arrays.asList(
        "inscriptions", "revenue", "admitted", "documents", "admissionRate"
    );

    public List<Goal> findAll() {
        return goalRepository.findAll();
    }

    public Goal findById(String id) {
        return goalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meta no encontrada"));
    }

    public Goal create(GoalRequest request) {
        validate(request);
        if (goalRepository.existsByKey(request.getKey())) {
            throw new ConflictException("Ya existe una meta para este indicador");
        }

        Goal goal = new Goal();
        goal.setKey(request.getKey());
        goal.setLabel(request.getLabel());
        goal.setTarget(request.getTarget());
        goal.setPeriod(request.getPeriod());
        goal.setCreatedAt(LocalDateTime.now());
        goal.setUpdatedAt(LocalDateTime.now());

        return goalRepository.save(goal);
    }

    public Goal update(String id, GoalRequest request) {
        validate(request);
        Goal goal = findById(id);

        goalRepository.findByKey(request.getKey())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Ya existe otra meta para este indicador");
                });

        goal.setKey(request.getKey());
        goal.setLabel(request.getLabel());
        goal.setTarget(request.getTarget());
        goal.setPeriod(request.getPeriod());
        goal.setUpdatedAt(LocalDateTime.now());

        return goalRepository.save(goal);
    }

    public void delete(String id) {
        Goal goal = findById(id);
        goalRepository.delete(goal);
    }

    private void validate(GoalRequest request) {
        if (!VALID_KEYS.contains(request.getKey())) {
            throw new IllegalArgumentException("Clave de meta no valida: " + request.getKey());
        }
        if (request.getTarget() == null || request.getTarget() <= 0) {
            throw new IllegalArgumentException("La meta debe ser mayor a 0");
        }
    }
}
