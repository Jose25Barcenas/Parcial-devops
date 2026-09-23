package com.sion.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InscriptionRequest {
    @NotBlank(message = "Programa requerido")
    private String program;

    @NotBlank(message = "Jornada requerida")
    private String schedule;
}
