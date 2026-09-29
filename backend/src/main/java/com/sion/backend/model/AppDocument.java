package com.sion.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@org.springframework.data.mongodb.core.mapping.Document(collection = "documents")
public class AppDocument {
    @Id
    private String id;
    @Indexed
    private String inscriptionId;
    private String docType;
    private String fileUrl;
    private String status = "pending";
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
