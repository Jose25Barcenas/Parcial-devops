package com.sion.backend.service;

import com.sion.backend.model.AdmissionResult;
import com.sion.backend.model.AppDocument;
import com.sion.backend.model.Inscription;
import com.sion.backend.model.Payment;
import com.sion.backend.repository.AdmissionResultRepository;
import com.sion.backend.repository.DocumentRepository;
import com.sion.backend.repository.InscriptionRepository;
import com.sion.backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final InscriptionRepository inscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final AdmissionResultRepository admissionResultRepository;
    private final DocumentRepository documentRepository;
    private final MongoTemplate mongoTemplate;

    public Map<String, Object> getKPIs() {
        List<Inscription> allInscriptions = inscriptionRepository.findAll();
        long total = allInscriptions.size();

        List<AdmissionResult> allAdmissions = admissionResultRepository.findAll();
        long admitted = allAdmissions.stream().filter(a -> "admitted".equals(a.getDecision())).count();
        long rejected = allAdmissions.stream().filter(a -> "rejected".equals(a.getDecision())).count();
        long pendingAdmission = allAdmissions.stream().filter(a -> "pending".equals(a.getDecision())).count();

        long inscriptionsWithPayment = allInscriptions.stream()
                .filter(i -> paymentRepository.existsByInscriptionId(i.getId()))
                .count();

        long completed = allInscriptions.stream().filter(i -> "completed".equals(i.getStatus())).count();

        long pending = total - completed;

        double completionRate = total > 0 ? Math.round((completed * 100.0) / total) : 0;
        double admissionRate = completed > 0 ? Math.round((admitted * 100.0) / completed) : 0;

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalInscriptions", total);
        kpis.put("admitted", admitted);
        kpis.put("rejected", rejected);
        kpis.put("pending", pending);
        kpis.put("completionRate", (long) completionRate);
        kpis.put("admissionRate", (long) admissionRate);
        kpis.put("inscriptionsWithPayment", inscriptionsWithPayment);
        kpis.put("avgTotalDays", 0);

        return kpis;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getProcessesByProgram() {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.group("program").count().as("count"),
                Aggregation.sort(Sort.Direction.DESC, "count"),
                Aggregation.project("count").and("_id").as("program")
        );

        List<Map> raw = mongoTemplate.aggregate(aggregation, "inscriptions", Map.class).getMappedResults();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map entry : raw) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("program", entry.get("program") != null ? entry.get("program") : "Sin programa");
            mapped.put("count", entry.get("count"));
            result.add(mapped);
        }
        return result;
    }

    public List<Map<String, Object>> getProcessesByDecision() {
        List<Map<String, Object>> result = new ArrayList<>();

        List<AdmissionResult> admissions = admissionResultRepository.findAll();
        long admitted = admissions.stream().filter(a -> "admitted".equals(a.getDecision())).count();
        long rejected = admissions.stream().filter(a -> "rejected".equals(a.getDecision())).count();
        long pending = admissions.stream().filter(a -> "pending".equals(a.getDecision())).count();

        result.add(Map.of("label", "Admitidos", "value", admitted, "color", "#4B7F52"));
        result.add(Map.of("label", "Rechazados", "value", rejected, "color", "#D32F2F"));
        result.add(Map.of("label", "Pendientes", "value", pending, "color", "#D6B656"));

        return result;
    }

    public Map<String, Object> getProcessesByStage() {
        List<Inscription> inscriptions = inscriptionRepository.findAll();

        Map<String, Object> stages = new LinkedHashMap<>();
        stages.put("inscription", 0L);
        stages.put("payment", 0L);
        stages.put("documents", 0L);
        stages.put("admission", 0L);
        stages.put("completed", 0L);

        for (Inscription inscription : inscriptions) {
            boolean hasPayment = paymentRepository.existsByInscriptionId(inscription.getId());
            boolean hasDocuments = !documentRepository.findByInscriptionIdOrderByUploadedAtDesc(inscription.getId()).isEmpty();
            boolean hasAdmission = admissionResultRepository.existsByInscriptionId(inscription.getId());

            if ("completed".equals(inscription.getStatus()) && hasAdmission) {
                stages.put("completed", (long) stages.get("completed") + 1);
            } else if (hasAdmission) {
                stages.put("admission", (long) stages.get("admission") + 1);
            } else if (hasDocuments) {
                stages.put("documents", (long) stages.get("documents") + 1);
            } else if (hasPayment) {
                stages.put("payment", (long) stages.get("payment") + 1);
            } else {
                stages.put("inscription", (long) stages.get("inscription") + 1);
            }
        }

        return stages;
    }

    public Map<String, Object> getStageAverages() {
        List<Inscription> inscriptions = inscriptionRepository.findAll();
        Map<String, Object> averages = new LinkedHashMap<>();
        averages.put("inscription", 0.0);
        averages.put("payment", 0.0);
        averages.put("documents", 0.0);
        averages.put("admission", 0.0);

        long inscriptionCount = 0;
        long paymentCount = 0;
        long documentsCount = 0;
        long admissionCount = 0;

        for (Inscription inscription : inscriptions) {
            Optional<Payment> payment = paymentRepository.findByInscriptionId(inscription.getId());
            List<AppDocument> documents = documentRepository.findByInscriptionIdOrderByUploadedAtDesc(inscription.getId());
            Optional<AdmissionResult> admission = admissionResultRepository.findByInscriptionId(inscription.getId());

            if (inscription.getCreatedAt() != null && inscription.getUpdatedAt() != null) {
                long days = java.time.Duration.between(inscription.getCreatedAt(), inscription.getUpdatedAt()).toDays();
                averages.put("inscription", (double) averages.get("inscription") + days);
                inscriptionCount++;
            }

            if (payment.isPresent() && payment.get().getPaidAt() != null && inscription.getCreatedAt() != null) {
                long days = java.time.Duration.between(inscription.getCreatedAt(), payment.get().getPaidAt()).toDays();
                averages.put("payment", (double) averages.get("payment") + days);
                paymentCount++;
            }

            if (!documents.isEmpty()) {
                LocalDateTime firstUpload = documents.get(0).getUploadedAt();
                if (firstUpload != null && payment.isPresent() && payment.get().getPaidAt() != null) {
                    long days = java.time.Duration.between(payment.get().getPaidAt(), firstUpload).toDays();
                    averages.put("documents", (double) averages.get("documents") + days);
                    documentsCount++;
                }
            }

            if (admission.isPresent() && admission.get().getEvaluatedAt() != null) {
                LocalDateTime lastDocTime = !documents.isEmpty() ? documents.get(0).getUploadedAt() : inscription.getCreatedAt();
                if (lastDocTime != null) {
                    long days = java.time.Duration.between(lastDocTime, admission.get().getEvaluatedAt()).toDays();
                    averages.put("admission", (double) averages.get("admission") + days);
                    admissionCount++;
                }
            }
        }

        if (inscriptionCount > 0) averages.put("inscription", Math.round((double) averages.get("inscription") / inscriptionCount * 10.0) / 10.0);
        if (paymentCount > 0) averages.put("payment", Math.round((double) averages.get("payment") / paymentCount * 10.0) / 10.0);
        if (documentsCount > 0) averages.put("documents", Math.round((double) averages.get("documents") / documentsCount * 10.0) / 10.0);
        if (admissionCount > 0) averages.put("admission", Math.round((double) averages.get("admission") / admissionCount * 10.0) / 10.0);

        return averages;
    }

    public List<Map<String, Object>> getMonthlyActivity() {
        List<Inscription> inscriptions = inscriptionRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();
        List<AdmissionResult> admissions = admissionResultRepository.findAll();
        List<AppDocument> documents = documentRepository.findAll();

        String[] monthNames = {"Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"};
        Map<String, Map<String, Long>> monthlyData = new LinkedHashMap<>();

        for (int i = 0; i < 12; i++) {
            monthlyData.put(monthNames[i], new LinkedHashMap<>() {{
                put("inscriptions", 0L);
                put("payments", 0L);
                put("documents", 0L);
                put("admissions", 0L);
            }});
        }

        for (Inscription ins : inscriptions) {
            if (ins.getCreatedAt() != null) {
                String month = monthNames[ins.getCreatedAt().getMonthValue() - 1];
                monthlyData.get(month).put("inscriptions", monthlyData.get(month).get("inscriptions") + 1);
            }
        }

        for (Payment pay : payments) {
            if (pay.getCreatedAt() != null) {
                String month = monthNames[pay.getCreatedAt().getMonthValue() - 1];
                monthlyData.get(month).put("payments", monthlyData.get(month).get("payments") + 1);
            }
        }

        for (AppDocument doc : documents) {
            if (doc.getUploadedAt() != null) {
                String month = monthNames[doc.getUploadedAt().getMonthValue() - 1];
                monthlyData.get(month).put("documents", monthlyData.get(month).get("documents") + 1);
            }
        }

        for (AdmissionResult adm : admissions) {
            if (adm.getEvaluatedAt() != null) {
                String month = monthNames[adm.getEvaluatedAt().getMonthValue() - 1];
                monthlyData.get(month).put("admissions", monthlyData.get(month).get("admissions") + 1);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        monthlyData.forEach((month, data) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", month);
            entry.putAll(data);
            result.add(entry);
        });

        return result;
    }

    public List<Map<String, Object>> getTimeline() {
        List<Inscription> inscriptions = inscriptionRepository.findAll();
        List<Map<String, Object>> timeline = new ArrayList<>();

        for (Inscription inscription : inscriptions) {
            Optional<Payment> payment = paymentRepository.findByInscriptionId(inscription.getId());
            List<AppDocument> documents = documentRepository.findByInscriptionIdOrderByUploadedAtDesc(inscription.getId());
            Optional<AdmissionResult> admission = admissionResultRepository.findByInscriptionId(inscription.getId());

            String currentStage;
            if ("completed".equals(inscription.getStatus()) && admission.isPresent()) {
                currentStage = "completed";
            } else if (admission.isPresent()) {
                currentStage = "admission";
            } else if (!documents.isEmpty()) {
                currentStage = "documents";
            } else if (payment.isPresent()) {
                currentStage = "payment";
            } else {
                currentStage = "inscription";
            }

            String decision = "pending";
            if (admission.isPresent()) {
                decision = admission.get().getDecision();
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", inscription.getId());
            entry.put("program", inscription.getProgram());
            entry.put("schedule", inscription.getSchedule());
            entry.put("currentStage", currentStage);
            entry.put("decision", decision);
            entry.put("createdAt", inscription.getCreatedAt());

            timeline.add(entry);
        }

        return timeline;
    }
}
