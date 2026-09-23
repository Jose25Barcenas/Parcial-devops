package com.sion.backend.service;

import com.sion.backend.dto.request.RegisterRequest;
import com.sion.backend.dto.request.UpdateUserRequest;
import com.sion.backend.dto.response.UserResponse;
import com.sion.backend.exception.ConflictException;
import com.sion.backend.exception.ResourceNotFoundException;
import com.sion.backend.model.User;
import com.sion.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("El correo ya esta registrado");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole("aspirant");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    public Page<User> findAll(int page, int limit) {
        return userRepository.findAll(PageRequest.of(page - 1, limit));
    }

    public User update(String id, UpdateUserRequest request, String currentUserEmail) {
        User user = findById(id);
        User currentUser = findByEmail(currentUserEmail);

        if (!user.getId().equals(currentUser.getId()) && !currentUser.getRole().equals("admin")) {
            throw new ResourceNotFoundException("No autorizado para actualizar este usuario");
        }

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public void delete(String id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }
        userRepository.deleteById(id);
    }
}
