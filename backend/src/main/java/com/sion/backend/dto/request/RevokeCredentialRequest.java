package com.sion.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public class RevokeCredentialRequest {

    @NotBlank(message = "Motivo de revocacion requerido")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
