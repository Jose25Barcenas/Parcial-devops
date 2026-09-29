package com.sion.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {
    @Id
    private String id;
    @Indexed
    private String inscriptionId;
    private Double amount = 80000.0;
    private String method;
    private String status = "pending";
    private String transactionId;
    private String receiptUrl;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt = LocalDateTime.now();
}
