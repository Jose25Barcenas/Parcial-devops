package com.sion.backend.repository;

import com.sion.backend.model.Credential;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CredentialRepository extends MongoRepository<Credential, String> {
    Optional<Credential> findByVerificationCode(String verificationCode);
    Optional<Credential> findByInscriptionIdAndType(String inscriptionId, String type);
    List<Credential> findByHolderEmailOrderByIssuedAtDesc(String holderEmail);
    Page<Credential> findByType(String type, Pageable pageable);
    Page<Credential> findByStatus(String status, Pageable pageable);
    boolean existsByInscriptionIdAndType(String inscriptionId, String type);
}
