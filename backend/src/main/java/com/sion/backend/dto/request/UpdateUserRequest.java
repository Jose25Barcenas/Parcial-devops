package com.sion.backend.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;

    @Email(message = "Correo invalido")
    private String email;

    private String phone;
}
