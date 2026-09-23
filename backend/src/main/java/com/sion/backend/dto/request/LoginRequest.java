package com.sion.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Correo requerido")
    @Email(message = "Correo invalido")
    private String email;

    @NotBlank(message = "Contrasena requerida")
    private String password;
}
