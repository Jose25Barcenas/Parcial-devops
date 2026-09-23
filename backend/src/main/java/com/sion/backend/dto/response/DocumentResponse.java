package com.sion.backend.dto.response;

import com.sion.backend.model.AppDocument;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DocumentResponse {
    private String id;
    private String inscriptionId;
    private String docType;
    private String fileUrl;
    private String status;
    private LocalDateTime uploadedAt;

    public static DocumentResponse fromDocument(AppDocument doc) {
        DocumentResponse res = new DocumentResponse();
        res.setId(doc.getId());
        res.setInscriptionId(doc.getInscriptionId());
        res.setDocType(doc.getDocType());
        res.setFileUrl(doc.getFileUrl());
        res.setStatus(doc.getStatus());
        res.setUploadedAt(doc.getUploadedAt());
        return res;
    }
}
