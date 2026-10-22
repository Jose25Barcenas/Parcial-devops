package com.sion.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerificationResponse {
    private boolean authentic;
    private boolean chainValid;
    private boolean contentMatches;
    private boolean anchored;
    private int totalBlocks;
    private String chainMessage;
    private CredentialResponse credential;
}
