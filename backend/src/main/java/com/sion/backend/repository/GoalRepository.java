package com.sion.backend.repository;

import com.sion.backend.model.Goal;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GoalRepository extends MongoRepository<Goal, String> {
    Optional<Goal> findByKey(String key);
    boolean existsByKey(String key);
}
