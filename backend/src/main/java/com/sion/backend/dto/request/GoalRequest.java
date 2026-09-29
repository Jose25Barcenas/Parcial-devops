package com.sion.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GoalRequest {
    @NotBlank(message = "Clave de meta requerida")
    private String key;

    @NotBlank(message = "Nombre de la meta requerido")
    private String label;

    @NotNull(message = "Valor de la meta requerido")
    private Double target;

    private String period;
}
