package com.sion.backend.repository;

import com.sion.backend.model.AppDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DocumentRepository extends MongoRepository<AppDocument, String> {
    List<AppDocument> findByInscriptionIdOrderByUploadedAtDesc(String inscriptionId);
}
