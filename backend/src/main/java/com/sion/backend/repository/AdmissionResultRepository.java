package com.sion.backend.repository;

import com.sion.backend.model.AdmissionResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AdmissionResultRepository extends MongoRepository<AdmissionResult, String> {
    Optional<AdmissionResult> findByInscriptionId(String inscriptionId);
    boolean existsByInscriptionId(String inscriptionId);
    Page<AdmissionResult> findByDecision(String decision, Pageable pageable);
}
