package com.sion.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sion.backend.model.Inscription;
import com.sion.backend.model.Payment;
import com.sion.backend.model.User;
import com.sion.backend.repository.InscriptionRepository;
import com.sion.backend.repository.PaymentRepository;
import com.sion.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RoleSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InscriptionRepository inscriptionRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    private String login(String email, String role) throws Exception {
        User user = new User();
        user.setFullName("User " + role);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(role);
        userRepository.save(user);

        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    @Test
    void aspirantBlockedFromAdminEndpoints() throws Exception {
        String token = login("aspirant.sec@test.com", "aspirant");

        mockMvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/inscriptions").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/admissions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"inscriptionId\":\"x\",\"decision\":\"admitted\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/admissions/xyz")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"inscriptionId\":\"x\",\"decision\":\"admitted\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/payments/xyz").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/inscriptions/xyz/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"completed\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminAllowedAdminEndpoints() throws Exception {
        String token = login("admin.sec@test.com", "admin");

        mockMvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/inscriptions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admissions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void aspirantCannotConfirmOthersPaymentOrReadOthersDocuments() throws Exception {
        User owner = new User();
        owner.setFullName("Owner");
        owner.setEmail("owner.sec@test.com");
        owner.setPasswordHash(passwordEncoder.encode("password123"));
        owner.setRole("aspirant");
        owner = userRepository.save(owner);

        Inscription inscription = new Inscription();
        inscription.setUserId(owner.getId());
        inscription.setProgram("Ingenieria de Sistemas");
        inscription.setSchedule("Diurna");
        inscription = inscriptionRepository.save(inscription);

        Payment payment = new Payment();
        payment.setInscriptionId(inscription.getId());
        payment.setMethod("pse");
        payment.setStatus("pending");
        payment = paymentRepository.save(payment);

        String intruderToken = login("intruder.sec@test.com", "aspirant");

        mockMvc.perform(patch("/api/v1/payments/" + payment.getId() + "/confirm")
                        .header("Authorization", "Bearer " + intruderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/documents/" + inscription.getId())
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());

        String realOwnerToken = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"owner.sec@test.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        realOwnerToken = objectMapper.readTree(realOwnerToken).get("token").asText();

        mockMvc.perform(patch("/api/v1/payments/" + payment.getId() + "/confirm")
                        .header("Authorization", "Bearer " + realOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    void onlyAdminCanChangeRoles() throws Exception {
        String aspirantToken = login("rolechange.sec@test.com", "aspirant");
        String aspirantId = userRepository.findByEmail("rolechange.sec@test.com").orElseThrow().getId();

        mockMvc.perform(put("/api/v1/users/" + aspirantId)
                        .header("Authorization", "Bearer " + aspirantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"admin\"}"))
                .andExpect(status().isForbidden());

        String adminToken = login("admin.role@test.com", "admin");

        mockMvc.perform(put("/api/v1/users/" + aspirantId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"admin\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("admin"));

        mockMvc.perform(put("/api/v1/users/" + aspirantId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"superadmin\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aspirantBlockedFromAnalyticsAndGoals() throws Exception {
        String token = login("aspirant.analytics@test.com", "aspirant");

        mockMvc.perform(get("/api/v1/analytics/kpis").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/analytics/revenue").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/goals").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        String adminToken = login("admin.analytics@test.com", "admin");
        mockMvc.perform(get("/api/v1/analytics/kpis").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/goals").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void authMeReturnsCurrentProfile() throws Exception {
        String token = login("me.sec@test.com", "aspirant");
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me.sec@test.com"))
                .andExpect(jsonPath("$.role").value("aspirant"));

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthReportsDatabaseStatus() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.database").value("up"));
    }

    @Test
    void aspirantCannotDeleteUsers() throws Exception {
        String intruderToken = login("deleter.sec@test.com", "aspirant");
        String victimId = userRepository.findByEmail("deleter.sec@test.com").orElseThrow().getId();

        mockMvc.perform(delete("/api/v1/users/" + victimId)
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());
    }
}
