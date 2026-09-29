package com.sion.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class HealthController {

    private final MongoTemplate mongoTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean dbUp;
        try {
            Document result = mongoTemplate.getDb().runCommand(Document.parse("{ping:1}"));
            Object ok = result.get("ok");
            dbUp = ok instanceof Number && ((Number) ok).doubleValue() == 1.0;
        } catch (Exception ex) {
            log.warn("Health check: ping a MongoDB fallo: {}", ex.toString());
            dbUp = false;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("status", dbUp ? "ok" : "degraded");
        body.put("database", dbUp ? "up" : "down");
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("service", "sion-backend");
        return ResponseEntity.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
