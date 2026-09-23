package com.sion.backend.controller;

import com.sion.backend.dto.request.PaymentRequest;
import com.sion.backend.dto.response.PaymentResponse;
import com.sion.backend.model.Payment;
import com.sion.backend.model.User;
import com.sion.backend.service.PaymentService;
import com.sion.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<PaymentResponse> create(
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        Payment payment = paymentService.create(request, user.getId());
        return ResponseEntity.ok(PaymentResponse.fromPayment(payment));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getById(@PathVariable String id) {
        Payment payment = paymentService.findById(id);
        return ResponseEntity.ok(PaymentResponse.fromPayment(payment));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<PaymentResponse> confirm(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String transactionId = body != null ? body.get("transactionId") : null;
        Payment payment = paymentService.confirm(id, transactionId);
        return ResponseEntity.ok(PaymentResponse.fromPayment(payment));
    }

    @PatchMapping("/{id}/receipt")
    public ResponseEntity<PaymentResponse> uploadReceipt(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        Payment payment = paymentService.uploadReceipt(id, file, user.getId());
        return ResponseEntity.ok(PaymentResponse.fromPayment(payment));
    }
}
