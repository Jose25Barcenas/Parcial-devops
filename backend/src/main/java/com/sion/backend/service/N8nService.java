package com.sion.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@Slf4j
public class N8nService {

    private final RestClient restClient;
    private final boolean enabled;

    public N8nService(
            @Value("${app.n8n.base-url:http://n8n:5678}") String baseUrl,
            @Value("${app.n8n.enabled:true}") boolean enabled) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(3000);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
        this.enabled = enabled;
    }

    public void sendInscriptionCreated(Map<String, Object> payload) {
        fire("/webhook/inscription-created", "inscription-created", payload);
    }

    public void sendPaymentConfirmed(Map<String, Object> payload) {
        fire("/webhook/payment-confirmed", "payment-confirmed", payload);
    }

    public void sendUserRegistered(Map<String, Object> payload) {
        fire("/webhook/user-registered", "user-registered", payload);
    }

    public void sendDocumentUploaded(Map<String, Object> payload) {
        fire("/webhook/document-uploaded", "document-uploaded", payload);
    }

    public void sendAdmissionDecided(Map<String, Object> payload) {
        fire("/webhook/admission-decided", "admission-decided", payload);
    }

    public void sendCredentialIssued(Map<String, Object> payload) {
        fire("/webhook/credential-issued", "credential-issued", payload);
    }

    private void fire(String path, String event, Map<String, Object> payload) {
        if (!enabled) {
            log.debug("[n8n] deshabilitado; se omite evento {}", event);
            return;
        }
        log.info("[n8n] Enviando evento '{}' -> POST {}", event, path);
        try {
            restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            log.info("[n8n] Evento '{}' enviado OK (workflow n8n disparado)", event);
        } catch (Exception e) {
            log.warn("[n8n] No se pudo enviar '{}': {}", event, e.getMessage());
        }
    }
}
