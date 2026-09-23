package com.sion.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "admission_results")
public class AdmissionResult {
    @Id
    private String id;
    private String inscriptionId;
    private String decision = "pending";
    private String period;
    private String notes;
    private LocalDateTime evaluatedAt;
}
