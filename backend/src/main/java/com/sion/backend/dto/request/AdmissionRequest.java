package com.sion.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdmissionRequest {
    @NotBlank(message = "Inscripcion requerida")
    private String inscriptionId;

    @NotBlank(message = "Decision requerida")
    private String decision;

    private String period;
    private String notes;
}
