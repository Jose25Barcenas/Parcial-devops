package com.sion.backend.service;

import com.sion.backend.dto.request.RegisterRequest;
import com.sion.backend.dto.request.UpdateUserRequest;
import com.sion.backend.dto.response.UserResponse;
import com.sion.backend.exception.ConflictException;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.exception.UnauthorizedException;
import com.sion.backend.model.User;
import com.sion.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;
    private static final int RESET_CODE_MINUTES = 10;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    public User register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("El correo ya esta registrado");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole("aspirant");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    public Page<User> findAll(int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(100, Math.max(1, limit));
        return userRepository.findAll(PageRequest.of(safePage - 1, safeLimit));
    }

    public User update(String id, UpdateUserRequest request, String currentUserEmail) {
        User user = findById(id);
        User currentUser = findByEmail(currentUserEmail);

        if (!user.getId().equals(currentUser.getId()) && !currentUser.getRole().equals("admin")) {
            throw new AccessDeniedException("No autorizado para actualizar este usuario");
        }

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) {
            String newEmail = normalizeEmail(request.getEmail());
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new ConflictException("El correo ya esta registrado");
            }
            user.setEmail(newEmail);
        }
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getRole() != null) {
            if (!currentUser.getRole().equals("admin")) {
                throw new AccessDeniedException("Solo un administrador puede cambiar roles");
            }
            if (!request.getRole().equals("admin") && !request.getRole().equals("aspirant")) {
                throw new IllegalArgumentException("Rol invalido. Valores permitidos: admin, aspirant");
            }
            user.setRole(request.getRole());
        }
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public void delete(String id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }
        userRepository.deleteById(id);
    }

    public User findByEmailIfExists(String email) {
        return userRepository.findByEmail(normalizeEmail(email)).orElse(null);
    }

    public void checkNotLocked(User user) {
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            long minutes = ChronoUnit.MINUTES.between(LocalDateTime.now(), user.getLockedUntil()) + 1;
            throw new UnauthorizedException("Cuenta bloqueada por 5 intentos fallidos. Intenta de nuevo en " + minutes + " minuto(s)");
        }
    }

    public void registerFailedAttempt(User user) {
        int attempts = user.getFailedAttempts() + 1;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setFailedAttempts(0);
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        } else {
            user.setFailedAttempts(attempts);
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void clearLoginFailures(User user) {
        if (user.getFailedAttempts() == 0 && user.getLockedUntil() == null) return;
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public String createPasswordResetCode(String email) {
        User user = userRepository.findByEmail(normalizeEmail(email)).orElse(null);
        if (user == null) return null;
        String code = String.valueOf(new SecureRandom().nextInt(900000) + 100000);
        user.setPasswordResetCode(passwordEncoder.encode(code));
        user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(RESET_CODE_MINUTES));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return code;
    }

    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(normalizeEmail(email)).orElse(null);
        boolean valid = user != null
                && user.getPasswordResetCode() != null
                && user.getPasswordResetExpiresAt() != null
                && user.getPasswordResetExpiresAt().isAfter(LocalDateTime.now())
                && passwordEncoder.matches(code, user.getPasswordResetCode());
        if (!valid) {
            throw new UnauthorizedException("Codigo de recuperacion invalido o expirado");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetCode(null);
        user.setPasswordResetExpiresAt(null);
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
