package com.sion.backend.controller;

import com.sion.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getKPIs() {
        return ResponseEntity.ok(analyticsService.getKPIs());
    }

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getRevenue() {
        return ResponseEntity.ok(analyticsService.getRevenue());
    }

    @GetMapping("/revenue-monthly")
    public ResponseEntity<?> getRevenueMonthly() {
        return ResponseEntity.ok(analyticsService.getRevenueMonthly());
    }

    @GetMapping("/goals-progress")
    public ResponseEntity<?> getGoalsProgress() {
        return ResponseEntity.ok(analyticsService.getGoalsProgress());
    }

    @GetMapping("/by-program")
    public ResponseEntity<?> getProcessesByProgram() {
        return ResponseEntity.ok(analyticsService.getProcessesByProgram());
    }

    @GetMapping("/by-decision")
    public ResponseEntity<?> getProcessesByDecision() {
        return ResponseEntity.ok(analyticsService.getProcessesByDecision());
    }

    @GetMapping("/by-stage")
    public ResponseEntity<Map<String, Object>> getProcessesByStage() {
        return ResponseEntity.ok(analyticsService.getProcessesByStage());
    }

    @GetMapping("/stage-averages")
    public ResponseEntity<Map<String, Object>> getStageAverages() {
        return ResponseEntity.ok(analyticsService.getStageAverages());
    }

    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyActivity() {
        return ResponseEntity.ok(analyticsService.getMonthlyActivity());
    }

    @GetMapping("/timeline")
    public ResponseEntity<?> getTimeline() {
        return ResponseEntity.ok(analyticsService.getTimeline());
    }
}
