package com.sion.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public class IssueCredentialRequest {

    @NotBlank(message = "Tipo de credencial requerido")
    private String type;

    private String inscriptionId;

    private String period;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getInscriptionId() { return inscriptionId; }
    public void setInscriptionId(String inscriptionId) { this.inscriptionId = inscriptionId; }
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
}
