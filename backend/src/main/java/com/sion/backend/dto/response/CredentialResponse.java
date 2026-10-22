package com.sion.backend.dto.response;

import com.sion.backend.model.Credential;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Representacion de la credencial. Solo incluye el hash de integridad,
 * nunca el contenido canonico completo (eso se recalcula en el servidor).
 */
@Data
public class CredentialResponse {
    private String id;
    private String verificationCode;
    private String type;
    private String title;
    private String holderName;
    private String holderDocument;
    private String holderEmail;
    private String inscriptionId;
    private String program;
    private String period;
    private String contentHash;
    private String anchorHash;
    private String status;
    private String revocationReason;
    private LocalDateTime issuedAt;
    private LocalDateTime revokedAt;
    private String issuedBy;

    /** URL publica de verificacion (se usa para generar el QR). */
    private String verificationUrl;

    public static CredentialResponse fromCredential(Credential c, String publicBaseUrl) {
        CredentialResponse res = new CredentialResponse();
        res.setId(c.getId());
        res.setVerificationCode(c.getVerificationCode());
        res.setType(c.getType());
        res.setTitle(c.getTitle());
        res.setHolderName(c.getHolderName());
        res.setHolderDocument(c.getHolderDocument());
        res.setHolderEmail(c.getHolderEmail());
        res.setInscriptionId(c.getInscriptionId());
        res.setProgram(c.getProgram());
        res.setPeriod(c.getPeriod());
        res.setContentHash(c.getContentHash());
        res.setAnchorHash(c.getAnchorHash());
        res.setStatus(c.getStatus());
        res.setRevocationReason(c.getRevocationReason());
        res.setIssuedAt(c.getIssuedAt());
        res.setRevokedAt(c.getRevokedAt());
        res.setIssuedBy(c.getIssuedBy());
        res.setVerificationUrl(publicBaseUrl + "/verify/" + c.getVerificationCode());
        return res;
    }
}
