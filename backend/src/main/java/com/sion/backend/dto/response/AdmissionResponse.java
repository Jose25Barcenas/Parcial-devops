package com.sion.backend.dto.response;

import com.sion.backend.model.AdmissionResult;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdmissionResponse {
    private String id;
    private String inscriptionId;
    private String decision;
    private String period;
    private String notes;
    private LocalDateTime evaluatedAt;

    public static AdmissionResponse fromAdmission(AdmissionResult result) {
        AdmissionResponse res = new AdmissionResponse();
        res.setId(result.getId());
        res.setInscriptionId(result.getInscriptionId());
        res.setDecision(result.getDecision());
        res.setPeriod(result.getPeriod());
        res.setNotes(result.getNotes());
        res.setEvaluatedAt(result.getEvaluatedAt());
        return res;
    }
}
