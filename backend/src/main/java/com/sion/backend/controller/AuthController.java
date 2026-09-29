package com.sion.backend.controller;

import com.sion.backend.dto.request.ForgotPasswordRequest;
import com.sion.backend.dto.request.LoginRequest;
import com.sion.backend.dto.request.RegisterRequest;
import com.sion.backend.dto.request.ResetPasswordRequest;
import com.sion.backend.dto.response.AuthResponse;
import com.sion.backend.dto.response.ForgotPasswordResponse;
import com.sion.backend.dto.response.UserResponse;
import com.sion.backend.model.User;
import com.sion.backend.security.JwtTokenProvider;
import com.sion.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;

    @Value("${sion.demo-mode:false}")
    private boolean demoMode;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String token = tokenProvider.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.fromUser(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User existing = userService.findByEmailIfExists(request.getEmail());
        if (existing != null) {
            userService.checkNotLocked(existing);
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            if (existing != null) {
                userService.registerFailedAttempt(existing);
            }
            throw ex;
        }

        User user = userService.findByEmail(request.getEmail());
        userService.clearLoginFailures(user);
        String token = tokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.fromUser(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String code = userService.createPasswordResetCode(request.getEmail());
        if (code == null) {
            return ResponseEntity.ok(new ForgotPasswordResponse(
                    "Si el correo existe, se enviara un codigo de recuperacion.", null));
        }
        if (demoMode) {
            return ResponseEntity.ok(new ForgotPasswordResponse(
                    "Modo demostracion: usa el codigo mostrado para restablecer tu contrasena.", code));
        }
        return ResponseEntity.ok(new ForgotPasswordResponse(
                "Se envio un codigo de recuperacion a tu correo.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Contrasena restablecida exitosamente"));
    }
}
