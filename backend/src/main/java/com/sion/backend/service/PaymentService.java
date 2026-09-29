package com.sion.backend.service;

import com.sion.backend.dto.request.PaymentRequest;
import com.sion.backend.exception.ConflictException;
import com.sion.backend.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import com.sion.backend.model.Inscription;
import com.sion.backend.model.Payment;
import com.sion.backend.repository.InscriptionRepository;
import com.sion.backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InscriptionRepository inscriptionRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private static final List<String> VALID_METHODS = Arrays.asList("pse", "tarjeta", "banco", "caja");
    private static final List<String> ALLOWED_RECEIPT_TYPES = Arrays.asList(
        "application/pdf", "image/jpeg", "image/png"
    );

    public Payment create(PaymentRequest request, String userId) {
        if (!VALID_METHODS.contains(request.getMethod())) {
            throw new IllegalArgumentException("Metodo de pago no valido");
        }

        Inscription inscription = inscriptionRepository.findById(request.getInscriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Inscripcion no encontrada"));

        if (!inscription.getUserId().equals(userId)) {
            throw new AccessDeniedException("No autorizado para pagar esta inscripcion");
        }

        if (paymentRepository.existsByInscriptionId(request.getInscriptionId())) {
            throw new ConflictException("Ya existe un pago para esta inscripcion");
        }

        Payment payment = new Payment();
        payment.setInscriptionId(request.getInscriptionId());
        payment.setAmount(80000.0);
        payment.setMethod(request.getMethod());
        payment.setStatus("pending");
        payment.setCreatedAt(LocalDateTime.now());

        return paymentRepository.save(payment);
    }

    public Payment findById(String id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));
    }

    public Payment findByInscriptionId(String inscriptionId, String userId, String role) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inscripcion no encontrada"));

        if (!inscription.getUserId().equals(userId) && !"admin".equals(role)) {
            throw new AccessDeniedException("No autorizado para ver el pago de esta inscripcion");
        }

        return paymentRepository.findByInscriptionId(inscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));
    }

    public Payment confirm(String id, String transactionId, String userId, String role) {
        Payment payment = findById(id);

        Inscription inscription = inscriptionRepository.findById(payment.getInscriptionId()).orElse(null);
        boolean isOwner = inscription != null && inscription.getUserId().equals(userId);
        if (!isOwner && !"admin".equals(role)) {
            throw new AccessDeniedException("No autorizado para confirmar este pago");
        }

        payment.setStatus("completed");
        payment.setPaidAt(LocalDateTime.now());
        if (transactionId != null) {
            payment.setTransactionId(transactionId);
        }

        if (inscription != null) {
            inscription.setStatus("completed");
            inscription.setUpdatedAt(LocalDateTime.now());
            inscriptionRepository.save(inscription);
        }

        return paymentRepository.save(payment);
    }

    public Payment uploadReceipt(String id, MultipartFile file, String userId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Archivo requerido");
        }

        if (!ALLOWED_RECEIPT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo PDF, JPEG, PNG");
        }

        Payment payment = findById(id);

        Inscription inscription = inscriptionRepository.findById(payment.getInscriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Inscripcion no encontrada"));

        if (!inscription.getUserId().equals(userId)) {
            throw new AccessDeniedException("No autorizado para subir comprobante a este pago");
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String filename = "receipt-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 9)
                    + getExtension(file.getOriginalFilename(), file.getContentType());
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            payment.setReceiptUrl("/api/v1/uploads/" + filename);
            return paymentRepository.save(payment);
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar el comprobante", e);
        }
    }

    private String getExtension(String filename, String contentType) {
        String ext = "";
        if (filename != null && filename.lastIndexOf('.') >= 0) {
            ext = filename.substring(filename.lastIndexOf('.') + 1)
                    .replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        }
        if (List.of("pdf", "png", "jpg", "jpeg").contains(ext)) return "." + ext;
        if ("application/pdf".equals(contentType)) return ".pdf";
        if ("image/png".equals(contentType)) return ".png";
        if ("image/jpeg".equals(contentType)) return ".jpg";
        return ".bin";
    }
}
