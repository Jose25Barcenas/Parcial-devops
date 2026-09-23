package com.sion.backend.repository;

import com.sion.backend.model.Inscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface InscriptionRepository extends MongoRepository<Inscription, String> {
    List<Inscription> findByUserIdOrderByCreatedAtDesc(String userId);
    Page<Inscription> findByStatus(String status, Pageable pageable);
}
