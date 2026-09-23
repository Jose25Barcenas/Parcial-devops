package com.sion.backend.dto.response;

import com.sion.backend.model.Inscription;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InscriptionResponse {
    private String id;
    private String userId;
    private String program;
    private String schedule;
    private String status;
    private LocalDateTime createdAt;

    public static InscriptionResponse fromInscription(Inscription ins) {
        InscriptionResponse res = new InscriptionResponse();
        res.setId(ins.getId());
        res.setUserId(ins.getUserId());
        res.setProgram(ins.getProgram());
        res.setSchedule(ins.getSchedule());
        res.setStatus(ins.getStatus());
        res.setCreatedAt(ins.getCreatedAt());
        return res;
    }
}
