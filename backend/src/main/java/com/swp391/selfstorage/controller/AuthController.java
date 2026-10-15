package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.*;
import com.swp391.selfstorage.entity.LoginHistory;
import com.swp391.selfstorage.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
        String email = body.get("email");
        Map<String, Object> pending = authService.getPendingOtp(email);
        if (pending == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Phiên xác minh không tồn tại hoặc đã hết hạn. Vui lòng đăng ký lại!"));
        }
        ApiResponse<Map<String, Object>> res = ApiResponse.ok("Đã gửi lại mã xác minh mới tới " + email + "!", pending);
        res.setCode((String) pending.get("code"));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@RequestBody RegisterRequest req, HttpServletRequest request) {
        try {
            authService.validateRegistrationData(req);
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null) ip = request.getRemoteAddr();
            var user = authService.registerUser(req, ip);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Đăng ký tài khoản thành công!", new UserDto(user)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/login-history")
    public ResponseEntity<ApiResponse<List<LoginHistory>>> getLoginHistory() {
        List<LoginHistory> history = authService.getLoginHistory();
        return ResponseEntity.ok(ApiResponse.list(history.size(), history));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = authService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.list(users.size(), users));
    }

    @PatchMapping("/users/{id}/toggle-lock")
    public ResponseEntity<ApiResponse<UserDto>> toggleLock(@PathVariable String id) {
        try {
            UserDto updated = authService.toggleLockUser(id);
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/rbac-matrix")
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
