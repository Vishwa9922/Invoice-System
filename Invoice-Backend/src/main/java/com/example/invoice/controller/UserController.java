package com.example.invoice.controller;

import com.example.invoice.domain.User;
import com.example.invoice.domain.enums.Role;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.UserResponse;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management APIs — Admin only")
@PreAuthorize("hasRole('ADMIN')")
public class UserController
{
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAll() {
        List<UserResponse> users = userRepository.findAll()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable Long id,
            @RequestParam Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setRole(role);
        return ResponseEntity.ok(ApiResponse.success("Role updated",
                toResponse(userRepository.save(user))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setActive(false);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("User deactivated", null));
    }

    private UserResponse toResponse(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId());
        r.setName(u.getName());
        r.setEmail(u.getEmail());
        r.setRole(u.getRole());
        r.setActive(u.isEnabled());
        r.setCreatedAt(u.getCreatedAt());
        return r;
    }
}
