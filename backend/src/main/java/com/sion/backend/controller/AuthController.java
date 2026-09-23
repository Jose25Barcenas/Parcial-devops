package com.sion.backend.controller;

import com.sion.backend.dto.request.LoginRequest;
import com.sion.backend.dto.request.RegisterRequest;
import com.sion.backend.dto.response.AuthResponse;
import com.sion.backend.dto.response.UserResponse;
import com.sion.backend.model.User;
import com.sion.backend.security.JwtTokenProvider;
import com.sion.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String token = tokenProvider.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.fromUser(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        String token = tokenProvider.generateToken(authentication);
        User user = userService.findByEmail(request.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.fromUser(user)));
    }
}
