package com.sion.backend.dto.response;

import com.sion.backend.model.User;
import lombok.Data;

@Data
public class UserResponse {
    private String id;
    private String fullName;
    private String email;
    private String phone;
    private String role;

    public static UserResponse fromUser(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setFullName(user.getFullName());
        res.setEmail(user.getEmail());
        res.setPhone(user.getPhone());
        res.setRole(user.getRole());
        return res;
    }
}
