package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.*;
import com.swp391.selfstorage.entity.LoginHistory;
import com.swp391.selfstorage.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@RequestBody LoginRequest req, HttpServletRequest request) {
        try {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null) ip = request.getRemoteAddr();
            String device = request.getHeader("User-Agent");
            if (device == null) device = "Web Browser";

            ApiResponse<UserDto> response = authService.login(req, ip, device);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendOtp(@RequestBody RegisterRequest req) {
        try {
            ApiResponse<Map<String, Object>> res = authService.generateAndSendOtp(req);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<UserDto>> verifyOtp(@RequestBody VerifyOtpRequest req, HttpServletRequest request) {
        try {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null) ip = request.getRemoteAddr();
            ApiResponse<UserDto> res = authService.verifyOtpAndRegister(req.getEmail(), req.getCode(), ip);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendOtp(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(authService.resendOtp(body.get("email")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@RequestBody RegisterRequest req) {
        try {
            return ResponseEntity.ok(authService.generateAndSendOtp(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/login-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<LoginHistory>>> getLoginHistory() {
        List<LoginHistory> history = authService.getLoginHistory();
        return ResponseEntity.ok(ApiResponse.list(history.size(), history));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = authService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.list(users.size(), users));
    }

    @PatchMapping("/users/{id}/toggle-lock")
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> toggleLock(@PathVariable String id) {
        try {
            UserDto updated = authService.toggleLockUser(id);
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@RequestBody AdminUserRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(authService.createUserByAdmin(request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable String id, @RequestBody AdminUserRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(authService.updateUserByAdmin(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/rbac-matrix")
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRbacMatrix() {
        Map<String, Object> rbac = new LinkedHashMap<>();
        rbac.put("CUSTOMER", Arrays.asList("VIEW_FACILITIES", "CREATE_RESERVATION", "PAY_DEPOSIT", "VIEW_RENTED_UNITS", "UPDATE_PIN", "CREATE_TICKET"));
        rbac.put("STAFF", Arrays.asList("CHECKIN_CUSTOMER", "HANDOVER_UNIT", "INSPECT_RETURN", "UPDATE_UNIT_STATUS", "DISPATCH_TASK"));
        rbac.put("FMANAGER", Arrays.asList("FACILITY_DASHBOARD", "ASSIGN_UNITS", "OVERSEE_STAFF", "MANAGE_FACILITY_UNITS"));
        rbac.put("OPS_MGR", Arrays.asList("CHAIN_OVERVIEW", "UPDATE_PRICING", "VIEW_FINANCIAL_REPORTS", "SET_PROMOTIONS"));
        rbac.put("ADMIN", Arrays.asList("ALL_SYSTEM_ACCESS", "USER_MANAGEMENT", "RBAC_CONFIG", "VIEW_AUDIT_LOGS"));

        return ResponseEntity.ok(ApiResponse.ok(rbac));
    }
}
