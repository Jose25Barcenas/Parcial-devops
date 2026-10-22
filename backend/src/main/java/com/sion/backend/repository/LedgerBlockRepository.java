package com.sion.backend.repository;

import com.sion.backend.model.LedgerBlock;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface LedgerBlockRepository extends MongoRepository<LedgerBlock, String> {
    Optional<LedgerBlock> findTopByOrderByIndexDesc();
    Optional<LedgerBlock> findByCredentialRef(String credentialRef);
    long countByType(String type);
}
