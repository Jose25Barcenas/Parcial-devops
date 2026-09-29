package com.sion.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sion.backend.dto.request.LoginRequest;
import com.sion.backend.dto.request.RegisterRequest;
import com.sion.backend.model.User;
import com.sion.backend.repository.UserRepository;
import com.sion.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterNewUser() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail("test@test.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("test@test.com"))
                .andExpect(jsonPath("$.user.fullName").value("Test User"));
    }

    @Test
    void shouldNotRegisterDuplicateEmail() throws Exception {
        User existing = new User();
        existing.setFullName("Existing");
        existing.setEmail("test@test.com");
        existing.setPasswordHash(passwordEncoder.encode("password123"));
        existing.setRole("aspirant");
        userRepository.save(existing);

        RegisterRequest request = new RegisterRequest();
        request.setFullName("Another User");
        request.setEmail("test@test.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldLoginWithValidCredentials() throws Exception {
        User user = new User();
        user.setFullName("Test User");
        user.setEmail("test@test.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole("aspirant");
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@test.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void shouldNotLoginWithInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@test.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldLockAccountAfterFiveFailedAttemptsAndUnlockWithResetCode() throws Exception {
        User user = new User();
        user.setFullName("Locked User");
        user.setEmail("locked@test.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole("aspirant");
        userRepository.save(user);

        LoginRequest wrong = new LoginRequest();
        wrong.setEmail("locked@test.com");
        wrong.setPassword("wrong-pass");
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrong)))
                    .andExpect(status().isUnauthorized());
        }

        LoginRequest correct = new LoginRequest();
        correct.setEmail("locked@test.com");
        correct.setPassword("password123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correct)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("bloqueada")));

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"locked@test.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demoCode").isNotEmpty());

        String forgotBody = mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"locked@test.com\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String code = objectMapper.readTree(forgotBody).get("demoCode").asText();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "locked@test.com",
                                "code", code,
                                "newPassword", "nueva123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());

        LoginRequest afterReset = new LoginRequest();
        afterReset.setEmail("locked@test.com");
        afterReset.setPassword("nueva123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(afterReset)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void shouldReturnOkForUnknownEmailOnForgotPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@test.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demoCode").doesNotExist())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void shouldRejectInvalidResetCode() throws Exception {
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@test.com\",\"code\":\"123456\",\"newPassword\":\"nueva123\"}"))
                .andExpect(status().isUnauthorized());
    }
}
