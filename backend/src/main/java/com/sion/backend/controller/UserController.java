package com.sion.backend.controller;

import com.sion.backend.dto.request.UpdateUserRequest;
import com.sion.backend.dto.response.MessageResponse;
import com.sion.backend.dto.response.PaginatedResponse;
import com.sion.backend.dto.response.UserResponse;
import com.sion.backend.model.User;
import com.sion.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<UserResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        Page<User> users = userService.findAll(page, limit);
        var response = users.getContent().stream().map(UserResponse::fromUser).toList();
        return ResponseEntity.ok(new PaginatedResponse<>(
                response, page, limit, users.getTotalElements(), users.getTotalPages()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getById(@PathVariable String id) {
        User user = userService.findById(id);
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.update(id, request, userDetails.getUsername());
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> delete(@PathVariable String id) {
        userService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Usuario eliminado"));
    }
}
