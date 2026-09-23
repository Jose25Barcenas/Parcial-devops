package com.sion.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentRequest {
    @NotBlank(message = "Inscripcion requerida")
    private String inscriptionId;

    @NotBlank(message = "Metodo de pago requerido")
    private String method;
}
