package com.sion.backend.service;

import com.sion.backend.exception.ConflictException;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.model.User;
import com.sion.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldFindUserByEmail() {
        User user = new User();
        user.setFullName("Test User");
        user.setEmail("test@test.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole("aspirant");
        userRepository.save(user);

        User found = userService.findByEmail("test@test.com");
        assertNotNull(found);
        assertEquals("test@test.com", found.getEmail());
    }

    @Test
    void shouldThrowWhenUserNotFound() {
        assertThrows(ResourceNotFoundException.class,
                () -> userService.findByEmail("nonexistent@test.com"));
    }

    @Test
    void shouldDeleteUser() {
        User user = new User();
        user.setFullName("To Delete");
        user.setEmail("delete@test.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole("aspirant");
        User saved = userRepository.save(user);

        assertDoesNotThrow(() -> userService.delete(saved.getId()));
        assertTrue(userRepository.findById(saved.getId()).isEmpty());
    }
}
