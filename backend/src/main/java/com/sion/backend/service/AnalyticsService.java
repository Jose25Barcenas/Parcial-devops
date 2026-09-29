package com.sion.backend.service;

import com.sion.backend.dto.response.GoalResponse;
import com.sion.backend.model.AdmissionResult;
import com.sion.backend.model.AppDocument;
import com.sion.backend.model.Goal;
import com.sion.backend.model.Inscription;
import com.sion.backend.model.Payment;
import com.sion.backend.repository.AdmissionResultRepository;
import com.sion.backend.repository.DocumentRepository;
import com.sion.backend.repository.GoalRepository;
import com.sion.backend.repository.InscriptionRepository;
import com.sion.backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final String[] MONTHS = {"Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"};

    private final InscriptionRepository inscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final AdmissionResultRepository admissionResultRepository;
    private final DocumentRepository documentRepository;
    private final GoalRepository goalRepository;
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

        Map<String, AdmissionResult> admissionByInscription = allAdmissions.stream()
                .collect(Collectors.toMap(AdmissionResult::getInscriptionId, a -> a, (a, b) -> a));

        double totalDays = 0;
        int counted = 0;
        for (Inscription inscription : allInscriptions) {
            AdmissionResult admission = admissionByInscription.get(inscription.getId());
            LocalDateTime end = admission != null ? admission.getEvaluatedAt() : null;
            if (end == null && "completed".equals(inscription.getStatus())) {
                end = inscription.getUpdatedAt();
            }
            if (inscription.getCreatedAt() != null && end != null) {
                totalDays += Duration.between(inscription.getCreatedAt(), end).toDays();
                counted++;
            }
        }
        double avgTotalDays = counted > 0 ? Math.round(totalDays / counted * 10.0) / 10.0 : 0;

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalInscriptions", total);
        kpis.put("admitted", admitted);
        kpis.put("rejected", rejected);
        kpis.put("pending", pending);
        kpis.put("completionRate", (long) completionRate);
        kpis.put("admissionRate", (long) admissionRate);
        kpis.put("inscriptionsWithPayment", inscriptionsWithPayment);
        kpis.put("avgTotalDays", avgTotalDays);

        return kpis;
    }

    public Map<String, Object> getRevenue() {
        List<Payment> payments = paymentRepository.findAll();

        double totalCollected = 0;
        double totalPending = 0;
        long countCollected = 0;
        long countPending = 0;
        Map<String, double[]> byMethod = new LinkedHashMap<>();

        for (Payment payment : payments) {
            double amount = payment.getAmount() != null ? payment.getAmount() : 0;
            boolean isCompleted = "completed".equals(payment.getStatus());
            String method = payment.getMethod() != null ? payment.getMethod() : "otro";

            if (isCompleted) {
                totalCollected += amount;
                countCollected++;
            } else {
                totalPending += amount;
                countPending++;
            }

            double[] agg = byMethod.computeIfAbsent(method, k -> new double[2]);
            agg[0]++;
            if (isCompleted) {
                agg[1] += amount;
            }
        }

        List<Map<String, Object>> methods = new ArrayList<>();
        byMethod.forEach((method, agg) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("method", method);
            entry.put("count", (long) agg[0]);
            entry.put("collected", Math.round(agg[1]));
            methods.add(entry);
        });

        double avgAmount = countCollected > 0 ? Math.round(totalCollected / countCollected) : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCollected", Math.round(totalCollected));
        result.put("totalPending", Math.round(totalPending));
        result.put("totalExpected", Math.round(totalCollected + totalPending));
        result.put("countCollected", countCollected);
        result.put("countPending", countPending);
        result.put("countTotal", payments.size());
        result.put("avgAmount", avgAmount);
        result.put("byMethod", methods);

        return result;
    }

    public List<Map<String, Object>> getRevenueMonthly() {
        List<Payment> payments = paymentRepository.findAll();

        Map<String, Map<String, Double>> monthlyData = new LinkedHashMap<>();
        for (String month : MONTHS) {
            Map<String, Double> data = new LinkedHashMap<>();
            data.put("collected", 0.0);
            data.put("pending", 0.0);
            monthlyData.put(month, data);
        }

        for (Payment payment : payments) {
            double amount = payment.getAmount() != null ? payment.getAmount() : 0;
            boolean isCompleted = "completed".equals(payment.getStatus());
            LocalDateTime date = isCompleted ? payment.getPaidAt() : payment.getCreatedAt();
            if (date == null) {
                continue;
            }
            String month = MONTHS[date.getMonthValue() - 1];
            String field = isCompleted ? "collected" : "pending";
            monthlyData.get(month).put(field, monthlyData.get(month).get(field) + amount);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        monthlyData.forEach((month, data) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", month);
            entry.put("collected", Math.round(data.get("collected")));
            entry.put("pending", Math.round(data.get("pending")));
            result.add(entry);
        });

        return result;
    }

    public List<Map<String, Object>> getGoalsProgress() {
        List<Goal> goals = goalRepository.findAll();

        long totalInscriptions = inscriptionRepository.count();
        long documents = documentRepository.count();
        long admitted = admissionResultRepository.findAll().stream()
                .filter(a -> "admitted".equals(a.getDecision())).count();
        double revenue = paymentRepository.findAll().stream()
                .filter(p -> "completed".equals(p.getStatus()))
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0)
                .sum();
        long completed = inscriptionRepository.findAll().stream()
                .filter(i -> "completed".equals(i.getStatus())).count();
        double admissionRate = completed > 0 ? Math.round((admitted * 100.0) / completed) : 0;

        Map<String, Double> actuals = new LinkedHashMap<>();
        actuals.put("inscriptions", (double) totalInscriptions);
        actuals.put("revenue", revenue);
        actuals.put("admitted", (double) admitted);
        actuals.put("documents", (double) documents);
        actuals.put("admissionRate", admissionRate);

        Map<String, Integer> keyOrder = new HashMap<>();
        for (int i = 0; i < GoalService.VALID_KEYS.size(); i++) {
            keyOrder.put(GoalService.VALID_KEYS.get(i), i);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        goals.stream()
                .sorted(Comparator.comparingInt(g -> keyOrder.getOrDefault(g.getKey(), 99)))
                .forEach(goal -> {
                    double actual = actuals.getOrDefault(goal.getKey(), 0.0);
                    double target = goal.getTarget() != null ? goal.getTarget() : 0;
                    double percent = target > 0 ? Math.round(actual * 100.0 / target) : 0;

                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("id", goal.getId());
                    entry.put("key", goal.getKey());
                    entry.put("label", goal.getLabel());
                    entry.put("target", goal.getTarget());
                    entry.put("actual", goal.getKey().equals("revenue") || goal.getKey().equals("admissionRate")
                            ? Math.round(actual) : actual);
                    entry.put("unit", GoalResponse.unitForKey(goal.getKey()));
                    entry.put("percent", percent);
                    entry.put("achieved", actual >= target);
                    entry.put("period", goal.getPeriod());
                    result.add(entry);
                });

        return result;
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

        Map<String, Map<String, Long>> monthlyData = new LinkedHashMap<>();

        for (int i = 0; i < 12; i++) {
            monthlyData.put(MONTHS[i], new LinkedHashMap<>() {{
                put("inscriptions", 0L);
                put("payments", 0L);
                put("documents", 0L);
                put("admissions", 0L);
            }});
        }

        for (Inscription ins : inscriptions) {
            if (ins.getCreatedAt() != null) {
                String month = MONTHS[ins.getCreatedAt().getMonthValue() - 1];
                monthlyData.get(month).put("inscriptions", monthlyData.get(month).get("inscriptions") + 1);
            }
        }

        for (Payment pay : payments) {
            if (pay.getCreatedAt() != null) {
                String month = MONTHS[pay.getCreatedAt().getMonthValue() - 1];
                monthlyData.get(month).put("payments", monthlyData.get(month).get("payments") + 1);
            }
        }

        for (AppDocument doc : documents) {
            if (doc.getUploadedAt() != null) {
                String month = MONTHS[doc.getUploadedAt().getMonthValue() - 1];
                monthlyData.get(month).put("documents", monthlyData.get(month).get("documents") + 1);
            }
        }

        for (AdmissionResult adm : admissions) {
            if (adm.getEvaluatedAt() != null) {
                String month = MONTHS[adm.getEvaluatedAt().getMonthValue() - 1];
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
