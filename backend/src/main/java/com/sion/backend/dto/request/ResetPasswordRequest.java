package com.sion.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Correo requerido")
    @Email(message = "Correo invalido")
    private String email;

    @NotBlank(message = "Codigo requerido")
    private String code;

    @NotBlank(message = "Contrasena requerida")
    @Size(min = 6, message = "Minimo 6 caracteres")
    private String newPassword;
}
