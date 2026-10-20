package com.swp391.selfstorage.service;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.dto.AdminUserRequest;
import com.swp391.selfstorage.dto.LoginRequest;
import com.swp391.selfstorage.dto.RegisterRequest;
import com.swp391.selfstorage.dto.UserDto;
import com.swp391.selfstorage.entity.LoginHistory;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.LoginHistoryRepository;
import com.swp391.selfstorage.repository.UserRepository;
import com.swp391.selfstorage.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // Email -> PendingOtpData
    private final Map<String, PendingOtpData> pendingOtps = new ConcurrentHashMap<>();

    private static final List<String> VALID_PROVINCES = Arrays.asList(
            "001","002","004","006","008","010","011","012","014","015","017","019",
            "020","022","024","025","026","027","030","031","033","034","035","036",
            "037","038","040","042","044","045","046","048","049","051","052","054",
            "056","058","060","062","064","066","067","068","070","072","074","075",
            "077","079","080","082","083","084","086","087","089","091","092","093",
            "094","095","096"
    );

    public AuthService(UserRepository userRepository,
                       LoginHistoryRepository loginHistoryRepository,
                       JwtUtil jwtUtil,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.loginHistoryRepository = loginHistoryRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    public ApiResponse<UserDto> login(LoginRequest req, String ip, String device) {
        if (req.getUsername() == null || req.getPassword() == null ||
                req.getUsername().trim().isEmpty() || req.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        String clean = req.getUsername().trim().toLowerCase();
        User user = userRepository.findByUsernameOrEmail(clean, clean)
                .orElse(null);

        if (user == null) {
            recordLogin(req.getUsername(), "Khách vãng lai", "UNKNOWN", ip, device, "FAILED");
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // Kiểm tra mật khẩu (hỗ trợ cả tài khoản mẫu ban đầu '1','2','3','4','5' và mật khẩu đã mã hóa BCrypt)
        String rawPassword = req.getPassword().trim();
        boolean encodedPassword = user.getPassword() != null && user.getPassword().startsWith("$2");
        boolean passwordMatches = encodedPassword
                ? passwordEncoder.matches(rawPassword, user.getPassword())
                : rawPassword.equals(user.getPassword());

        if (!passwordMatches) {
            recordLogin(user.getUsername(), user.getName(), user.getRole(), ip, device, "FAILED");
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        if ("LOCKED".equalsIgnoreCase(user.getStatus()) || "DISABLED".equalsIgnoreCase(user.getStatus())) {
            recordLogin(user.getUsername(), user.getName(), user.getRole(), ip, device, "BLOCKED");
            throw new IllegalArgumentException("Tài khoản đã bị khóa!");
        }
        if (!encodedPassword) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("Email chưa được xác minh!");
        }

        recordLogin(user.getUsername(), user.getName(), user.getRole(), ip, device, "SUCCESS");

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getFacilityCode());
        UserDto dto = new UserDto(user);

        return ApiResponse.ok("Đăng nhập thành công! Chào mừng " + user.getName(), dto, token);
    }

    public void validateRegistrationData(RegisterRequest data) {
        if (data.getName() == null || data.getName().trim().length() < 2 || data.getName().trim().length() > 50) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // Tên tiếng Việt hợp lệ
        String nameRegex = "^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\\s]+$";
        if (!Pattern.matches(nameRegex, data.getName().trim())) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // Ngày sinh & tuổi 18 - 100
        if (data.getDob() == null || data.getDob().trim().isEmpty()) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        LocalDate dob;
        try {
            dob = LocalDate.parse(data.getDob().trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        LocalDate today = LocalDate.now();
        if (dob.isAfter(today)) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        int age = Period.between(dob, today).getYears();
        if (age < 18 || age > 100) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // Giới tính
        if (data.getGender() == null || (!data.getGender().equals("Nam") && !data.getGender().equals("Nữ"))) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // Số điện thoại
        if (data.getPhone() == null) throw new IllegalArgumentException("Thông tin không hợp lệ!");
        String cleanPhone = data.getPhone().replaceAll("[\\s.-]", "");
        if (!cleanPhone.matches("^(03|05|07|08|09)[0-9]{8}$")
            || cleanPhone.matches("(\\d)\\1{9}")
            || Set.of("0999999999", "0123456789", "1234567890", "9876543210").contains(cleanPhone)) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // Email
        if (data.getEmail() == null) throw new IllegalArgumentException("Thông tin không hợp lệ!");
        String cleanEmail = data.getEmail().trim().toLowerCase();
        if (!cleanEmail.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$") || cleanEmail.contains("..")) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        String domain = cleanEmail.substring(cleanEmail.indexOf("@") + 1);
        List<String> fakeDomains = Arrays.asList("test.com", "example.com", "fake.com", "mailinator.com", "tempmail.com", "abc.xyz");
        if (fakeDomains.contains(domain)) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // CCCD
        if (data.getCccd() == null) throw new IllegalArgumentException("Thông tin không hợp lệ!");
        String cleanCccd = data.getCccd().replaceAll("\\s", "");
        if (!cleanCccd.matches("^[0-9]{12}$")) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        String provinceCode = cleanCccd.substring(0, 3);
        if (!VALID_PROVINCES.contains(provinceCode)) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        int genderCentury = cleanCccd.charAt(3) - '0';
        if (genderCentury < 0 || genderCentury > 3) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        int cccdBirthYear = (genderCentury < 2 ? 1900 : 2000)
                + Integer.parseInt(cleanCccd.substring(4, 6));
        boolean cccdIsMale = genderCentury % 2 == 0;
        if (cccdBirthYear != dob.getYear()
                || cccdIsMale != "Nam".equals(data.getGender())) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // Tên đăng nhập
        if (data.getUsername() == null) throw new IllegalArgumentException("Thông tin không hợp lệ!");
        String cleanUsername = data.getUsername().trim().toLowerCase();
        if (!cleanUsername.matches("^[a-zA-Z0-9_]{4,20}$") || cleanUsername.matches("^[0-9].*")) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        if (userRepository.existsByUsername(cleanUsername) || userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        // Mật khẩu
        if (data.getPassword() == null || data.getPassword().length() < 6) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        if (data.getConfirmPassword() == null || !data.getPassword().equals(data.getConfirmPassword())) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
    }

    public ApiResponse<Map<String, Object>> generateAndSendOtp(RegisterRequest data) {
        validateRegistrationData(data);

        String cleanEmail = data.getEmail().trim().toLowerCase();
        PendingOtpData pending = createOtp(data);
        pendingOtps.put(cleanEmail, pending);

        System.out.println("[AuthService] 📬 Đã gửi mã xác minh email tới [" + cleanEmail + "]: Mã OTP = " + pending.code);

        Map<String, Object> respData = new HashMap<>();
        respData.put("email", cleanEmail);
        respData.put("code", pending.code);

        ApiResponse<Map<String, Object>> resp = ApiResponse.ok(
                "Mã xác minh đã được gửi tới email " + cleanEmail + "!",
                respData
        );
        resp.setCode(pending.code);
        resp.setEmail(cleanEmail);
        return resp;
    }

    public ApiResponse<Map<String, Object>> resendOtp(String email) {
        String cleanEmail = email == null ? "" : email.trim().toLowerCase();
        PendingOtpData current = pendingOtps.get(cleanEmail);
        if (current == null || System.currentTimeMillis() > current.expiresAt) {
            pendingOtps.remove(cleanEmail);
            throw new IllegalArgumentException("Phiên xác minh không tồn tại hoặc đã hết hạn. Vui lòng đăng ký lại!");
        }
        long now = System.currentTimeMillis();
        if (now < current.resendAfter) {
            long waitSeconds = Math.max(1, (current.resendAfter - now + 999) / 1000);
            throw new IllegalArgumentException("Vui lòng chờ " + waitSeconds + " giây trước khi gửi lại mã.");
        }
        PendingOtpData replacement = createOtp(current.data);
        pendingOtps.put(cleanEmail, replacement);
        System.out.println("[AuthService] 📬 Đã gửi lại mã xác minh email tới [" + cleanEmail + "]: Mã OTP = " + replacement.code);
        Map<String, Object> data = new HashMap<>();
        data.put("email", cleanEmail);
        data.put("code", replacement.code);
        ApiResponse<Map<String, Object>> response = ApiResponse.ok("Đã gửi lại mã xác minh mới tới " + cleanEmail + "!", data);
        response.setCode(replacement.code);
        response.setEmail(cleanEmail);
        return response;
    }

    public ApiResponse<UserDto> verifyOtpAndRegister(String email, String code, String ip) {
        if (email == null || code == null) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        String cleanEmail = email.trim().toLowerCase();
        PendingOtpData pending = pendingOtps.get(cleanEmail);

        if (pending == null) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }
        if (System.currentTimeMillis() > pending.expiresAt) {
            pendingOtps.remove(cleanEmail);
            throw new IllegalArgumentException("Mã xác minh đã hết hạn!");
        }
        if (!pending.code.equals(code.trim())) {
            throw new IllegalArgumentException("Thông tin không hợp lệ!");
        }

        User newUser = registerUser(pending.data, ip);
        pendingOtps.remove(cleanEmail);

        String token = jwtUtil.generateToken(newUser.getUsername(), newUser.getRole(), newUser.getFacilityCode());
        return ApiResponse.ok(
                "Xác minh email thành công! Chào mừng " + newUser.getName() + " đến với hệ thống STORAGE.",
                new UserDto(newUser),
                token
        );
    }

    public User registerUser(RegisterRequest data, String ip) {
        String cleanUsername = data.getUsername().trim().toLowerCase();
        String cleanEmail = data.getEmail().trim().toLowerCase();

        String userId = "USR-" + UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setName(data.getName().trim());
        user.setUsername(cleanUsername);
        user.setPassword(passwordEncoder.encode(data.getPassword().trim()));
        user.setEmail(cleanEmail);
        user.setPhone(data.getPhone() != null ? data.getPhone().trim() : "");
        user.setCccd(data.getCccd() != null ? data.getCccd().trim() : "001202099999");
        user.setRole("CUSTOMER");
        user.setRoleTitle("Khách hàng thuê kho");
        user.setFacility(data.getFacility() != null ? data.getFacility() : "Hà Nội - Cầu Giấy");
        user.setFacilityCode(data.getFacilityCode() != null ? data.getFacilityCode() : "HN-CG");
        user.setStatus("ACTIVE");
        user.setEmailVerified(true);
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        recordLogin(saved.getUsername(), saved.getName(), saved.getRole(), ip, "Web Register", "SUCCESS");
        return saved;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::new)
                .collect(Collectors.toList());
    }

    public UserDto getCurrentUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Phiên đăng nhập không hợp lệ.");
        }
        User user = userRepository.findByUsername(username.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại."));
        if ("LOCKED".equalsIgnoreCase(user.getStatus()) || "DISABLED".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa!");
        }
        return new UserDto(user);
    }

    public List<UserDto> getFacilityStaff(String managerUsername) {
        User manager = userRepository.findByUsername(managerUsername)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại."));
        if (!Set.of("FMANAGER", "FACILITY_MANAGER").contains(manager.getRole())
                || manager.getFacilityCode() == null || manager.getFacilityCode().isBlank()) {
            throw new IllegalArgumentException("Không có quyền xem nhân viên chi nhánh.");
        }
        return userRepository.findByFacilityCodeAndRoleAndStatus(manager.getFacilityCode(), "STAFF", "ACTIVE")
                .stream().map(UserDto::new).toList();
    }

    public UserDto toggleLockUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        if ("ADMIN".equals(user.getRole()) && "ACTIVE".equalsIgnoreCase(user.getStatus())
                && userRepository.findAll().stream().filter(candidate -> "ADMIN".equals(candidate.getRole())
                && "ACTIVE".equalsIgnoreCase(candidate.getStatus())).count() <= 1) {
            throw new IllegalArgumentException("Cannot lock the last active admin");
        }
        user.setStatus("ACTIVE".equalsIgnoreCase(user.getStatus()) ? "LOCKED" : "ACTIVE");
        return new UserDto(userRepository.save(user));
    }

    public UserDto createUserByAdmin(AdminUserRequest request) {
        if (request == null) throw new IllegalArgumentException("Invalid account payload");
        String username = required(request.getUsername(), "username").toLowerCase(Locale.ROOT);
        String email = required(request.getEmail(), "email").toLowerCase(Locale.ROOT);
        if (!username.matches("^[a-zA-Z][a-zA-Z0-9_]{3,19}$")) throw new IllegalArgumentException("Invalid username");
        if (request.getPassword() == null || request.getPassword().trim().length() < 6) throw new IllegalArgumentException("Password must contain at least 6 characters");
        if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) throw new IllegalArgumentException("Username or email already exists");
        User user = new User();
        user.setId("USR-" + UUID.randomUUID());
        user.setName(required(request.getName(), "name")); user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword().trim())); user.setEmail(email);
        user.setPhone(clean(request.getPhone())); user.setCccd(clean(request.getCccd()));
        applyRoleAndFacility(user, request.getRole(), request.getFacility(), request.getFacilityCode());
        user.setStatus(normalizeStatus(request.getStatus())); user.setEmailVerified(true); user.setCreatedAt(LocalDateTime.now());
        return new UserDto(userRepository.save(user));
    }

    public UserDto updateUserByAdmin(String id, AdminUserRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (request == null) throw new IllegalArgumentException("Invalid payload");
        if (request.getName() != null && !request.getName().isBlank()) user.setName(request.getName().trim());
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
            userRepository.findByEmail(email).filter(other -> !other.getId().equals(id)).ifPresent(other -> { throw new IllegalArgumentException("Email already exists"); });
            user.setEmail(email);
        }
        if (request.getPhone() != null) user.setPhone(request.getPhone().trim());
        if (request.getCccd() != null) user.setCccd(request.getCccd().trim());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().trim().length() < 6) throw new IllegalArgumentException("Password must contain at least 6 characters");
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }
        if (request.getRole() != null && "ADMIN".equals(user.getRole()) && !"ADMIN".equalsIgnoreCase(request.getRole())
                && userRepository.findAll().stream().filter(candidate -> "ADMIN".equals(candidate.getRole())
                && "ACTIVE".equalsIgnoreCase(candidate.getStatus())).count() <= 1) {
            throw new IllegalArgumentException("Cannot remove the last active admin");
        }
        if (request.getRole() != null || request.getFacility() != null || request.getFacilityCode() != null) {
            applyRoleAndFacility(user, request.getRole() == null ? user.getRole() : request.getRole(),
                    request.getFacility() == null ? user.getFacility() : request.getFacility(),
                    request.getFacilityCode() == null ? user.getFacilityCode() : request.getFacilityCode());
        }
        if (request.getStatus() != null) {
            String status = normalizeStatus(request.getStatus());
            if ("ADMIN".equals(user.getRole()) && "ACTIVE".equalsIgnoreCase(user.getStatus()) && "LOCKED".equals(status)
                    && userRepository.findAll().stream().filter(candidate -> "ADMIN".equals(candidate.getRole())
                    && "ACTIVE".equalsIgnoreCase(candidate.getStatus())).count() <= 1) {
                throw new IllegalArgumentException("Cannot lock the last active admin");
            }
            user.setStatus(status);
        }
        return new UserDto(userRepository.save(user));
    }

    private void applyRoleAndFacility(User user, String roleInput, String facility, String facilityCode) {
        String role = roleInput == null ? "CUSTOMER" : roleInput.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR", "ADMIN").contains(role)) throw new IllegalArgumentException("Invalid role");
        user.setRole(role);
        user.setRoleTitle(Map.of("CUSTOMER", "Storage Customer", "STAFF", "Facility Staff", "FMANAGER", "Facility Manager", "OPS_MGR", "Business Operations Manager", "ADMIN", "System Administrator").get(role));
        user.setFacility(facility == null || facility.isBlank() ? "HQ" : facility.trim());
        String code = facilityCode == null || facilityCode.isBlank() ? ("CUSTOMER".equals(role) ? "HN-CG" : "HQ") : facilityCode.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("HN-CG", "HCM-Q7", "HN-NTL", "HCM-TB", "DN-HC", "HQ").contains(code)) throw new IllegalArgumentException("Invalid facility scope");
        user.setFacilityCode(code);
    }

    private static String normalizeStatus(String value) {
        String status = value == null || value.isBlank() ? "ACTIVE" : value.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("ACTIVE", "LOCKED", "DISABLED").contains(status)) throw new IllegalArgumentException("Invalid status");
        return status;
    }
    private static String required(String value, String field) { if (value == null || value.trim().isBlank()) throw new IllegalArgumentException("Missing " + field); return value.trim(); }
    private static String clean(String value) { return value == null ? "" : value.trim(); }

    public List<LoginHistory> getLoginHistory() {
        return loginHistoryRepository.findAllByOrderByCreatedAtDesc();
    }

    public Map<String, Object> getPendingOtp(String email) {
        String clean = (email != null) ? email.trim().toLowerCase() : "";
        PendingOtpData pending = pendingOtps.get(clean);
        if (pending == null) return null;
        Map<String, Object> m = new HashMap<>();
        m.put("email", clean);
        m.put("code", pending.code);
        return m;
    }

    private static PendingOtpData createOtp(RegisterRequest data) {
        long now = System.currentTimeMillis();
        String code = String.valueOf(100000 + new java.security.SecureRandom().nextInt(900000));
        return new PendingOtpData(code, data, now + 5 * 60 * 1000, now + 60 * 1000);
    }

    private void recordLogin(String username, String name, String role, String ip, String device, String status) {
        try {
            String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            LoginHistory log = new LoginHistory(username, name, role, timeStr, ip, device, status);
            loginHistoryRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to record login history: " + e.getMessage());
        }
    }

    private static class PendingOtpData {
        final String code;
        final RegisterRequest data;
        final long expiresAt;
        final long resendAfter;

        PendingOtpData(String code, RegisterRequest data, long expiresAt, long resendAfter) {
            this.code = code;
            this.data = data;
            this.expiresAt = expiresAt;
            this.resendAfter = resendAfter;
        }
    }
}
