package com.sion.backend.dto.response;

import com.sion.backend.model.Payment;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private String id;
    private String inscriptionId;
    private Double amount;
    private String method;
    private String status;
    private String transactionId;
    private String receiptUrl;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;

    public static PaymentResponse fromPayment(Payment payment) {
        PaymentResponse res = new PaymentResponse();
        res.setId(payment.getId());
        res.setInscriptionId(payment.getInscriptionId());
        res.setAmount(payment.getAmount());
        res.setMethod(payment.getMethod());
        res.setStatus(payment.getStatus());
        res.setTransactionId(payment.getTransactionId());
        res.setReceiptUrl(payment.getReceiptUrl());
        res.setPaidAt(payment.getPaidAt());
        res.setCreatedAt(payment.getCreatedAt());
        return res;
    }
}
