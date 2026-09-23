package com.sion.backend.repository;

import com.sion.backend.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByInscriptionId(String inscriptionId);
    boolean existsByInscriptionId(String inscriptionId);
}
