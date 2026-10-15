package com.swp391.selfstorage.config;

import com.swp391.selfstorage.entity.*;
import com.swp391.selfstorage.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final UnitRepository unitRepository;
    private final ContractRepository contractRepository;
    private final DailyTaskRepository dailyTaskRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           FacilityRepository facilityRepository,
                           UnitRepository unitRepository,
                           ContractRepository contractRepository,
                           DailyTaskRepository dailyTaskRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.unitRepository = unitRepository;
        this.contractRepository = contractRepository;
        this.dailyTaskRepository = dailyTaskRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedFacilities();
        seedUnits();
        seedUsers();
        seedContracts();
        seedTasks();
        seedAuditLogs();
        System.out.println("[DataInitializer] ✅ Khởi tạo dữ liệu mẫu hệ thống hoàn tất.");
    }

    private void seedFacilities() {
        if (facilityRepository.count() == 0) {
            List<Facility> facilities = Arrays.asList(
                    new Facility("HN-CG", "Cơ sở Cầu Giấy (Flagship HQ)", "120 Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy", "Hà Nội", "1900 6868", 120, 96, BigDecimal.valueOf(80.0), "ACTIVE"),
                    new Facility("HCM-Q7", "Cơ sở Quận 7 (Nam Sài Gòn)", "456 Nguyễn Thị Thập, P. Tân Quy, Quận 7", "TP. Hồ Chí Minh", "1900 6869", 150, 128, BigDecimal.valueOf(85.3), "ACTIVE"),
                    new Facility("HN-NTL", "Cơ sở Nam Từ Liêm", "Khu Công nghệ cao Láng Hòa Lạc", "Hà Nội", "1900 6870", 100, 70, BigDecimal.valueOf(70.0), "ACTIVE"),
                    new Facility("HCM-TB", "Cơ sở Tân Bình", "18 Cộng Hòa, Phường 4, Q. Tân Bình", "TP. Hồ Chí Minh", "1900 6871", 110, 85, BigDecimal.valueOf(77.2), "ACTIVE"),
                    new Facility("DN-HC", "Cơ sở Đà Nẵng", "78 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu", "Đà Nẵng", "1900 6872", 80, 53, BigDecimal.valueOf(66.2), "ACTIVE")
            );
            facilityRepository.saveAll(facilities);
            System.out.println("[DataInitializer] 🏢 Đã nạp 5 chi nhánh kho toàn quốc.");
        }
    }

    private void seedUnits() {
        if (unitRepository.count() == 0) {
            List<Unit> units = Arrays.asList(
                    new Unit("A-101", "HN-CG", "S", "2.0 m²", BigDecimal.valueOf(2.0), BigDecimal.valueOf(800000), "available", null, "842916"),
                    new Unit("A-102", "HN-CG", "M", "5.0 m²", BigDecimal.valueOf(5.0), BigDecimal.valueOf(1450000), "reserved", "Trần Văn Bảo", "842916"),
                    new Unit("A-103", "HN-CG", "M", "5.0 m²", BigDecimal.valueOf(5.0), BigDecimal.valueOf(1450000), "occupied", "Lê Hoàng Nam", "771239"),
                    new Unit("A-104", "HN-CG", "L", "10.0 m²", BigDecimal.valueOf(10.0), BigDecimal.valueOf(2800000), "occupied", "Công ty Alpha Logistics", "918234"),
                    new Unit("A-105", "HN-CG", "S", "3.0 m²", BigDecimal.valueOf(3.0), BigDecimal.valueOf(950000), "available", null, "842916"),
                    new Unit("A-106", "HN-CG", "M", "5.0 m²", BigDecimal.valueOf(5.0), BigDecimal.valueOf(1450000), "occupied", "Hoàng Minh Châu", "629104"),
                    new Unit("A-107", "HN-CG", "L", "12.0 m²", BigDecimal.valueOf(12.0), BigDecimal.valueOf(3200000), "maintenance", null, "000000"),
                    new Unit("A-108", "HN-CG", "M", "6.0 m²", BigDecimal.valueOf(6.0), BigDecimal.valueOf(1600000), "cleaning", null, "000000"),
                    new Unit("A-109", "HN-CG", "S", "2.5 m²", BigDecimal.valueOf(2.5), BigDecimal.valueOf(850000), "occupied", "Phạm Thu Trang", "512984"),
                    new Unit("A-110", "HN-CG", "M", "5.0 m²", BigDecimal.valueOf(5.0), BigDecimal.valueOf(1450000), "available", null, "842916"),
                    new Unit("A-111", "HN-CG", "L", "10.0 m²", BigDecimal.valueOf(10.0), BigDecimal.valueOf(2800000), "occupied", "Vũ Quốc Đạt", "491204"),
                    new Unit("A-112", "HN-CG", "M", "5.0 m²", BigDecimal.valueOf(5.0), BigDecimal.valueOf(1450000), "available", null, "842916"),
                    new Unit("A-113", "HN-CG", "L", "12.0 m²", BigDecimal.valueOf(12.0), BigDecimal.valueOf(3200000), "occupied", "Công ty CP Đầu tư Á Châu", "948123"),
                    new Unit("A-114", "HN-CG", "S", "2.0 m²", BigDecimal.valueOf(2.0), BigDecimal.valueOf(800000), "available", null, "842916"),
                    new Unit("A-115", "HN-CG", "M", "5.0 m²", BigDecimal.valueOf(5.0), BigDecimal.valueOf(1450000), "reserved", "Nguyễn Kiều Oanh", "842916"),
                    new Unit("A-116", "HN-CG", "S", "3.0 m²", BigDecimal.valueOf(3.0), BigDecimal.valueOf(950000), "cleaning", null, "000000"),
                    new Unit("A-117", "HN-CG", "L", "10.0 m²", BigDecimal.valueOf(10.0), BigDecimal.valueOf(2800000), "available", null, "842916"),
                    new Unit("A-118", "HN-CG", "M", "5.0 m²", BigDecimal.valueOf(5.0), BigDecimal.valueOf(1450000), "available", null, "842916")
            );
            unitRepository.saveAll(units);
            System.out.println("[DataInitializer] 📦 Đã nạp 18 phòng kho mẫu cơ sở Cầu Giấy.");
        }
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            List<User> users = Arrays.asList(
                    new User("USR-01", "Trần Văn Bảo", "customer", "1", "customer@selfstorage.vn", "0987.654.321", "001202019988", "CUSTOMER", "Khách hàng thuê kho", "Hà Nội - Cầu Giấy", "HN-CG", "ACTIVE"),
                    new User("USR-02", "Nguyễn Văn Tuấn", "staff", "3", "staff@selfstorage.vn", "0912.345.678", "001201044556", "STAFF", "Nhân viên cơ sở", "Hà Nội - Cầu Giấy", "HN-CG", "ACTIVE"),
                    new User("USR-03", "Lê Thị Mai", "staff2", "3", "mai.lt@selfstorage.vn", "0903.112.233", "001203099881", "STAFF", "Nhân viên cơ sở", "Hà Nội - Cầu Giấy", "HN-CG", "ACTIVE"),
                    new User("USR-04", "Phạm Hải Đăng", "manager", "4", "manager@selfstorage.vn", "0934.567.890", "001200055443", "FMANAGER", "Quản lý cơ sở", "Hà Nội - Cầu Giấy", "HN-CG", "ACTIVE"),
                    new User("USR-05", "Đặng Hoàng Long", "business", "5", "business@selfstorage.vn", "0918.777.666", "001200011223", "OPS_MGR", "Quản lý vận hành toàn chuỗi", "Toàn hệ thống (HQ)", "HQ", "ACTIVE"),
                    new User("USR-06", "Quản trị viên Hệ thống", "admin", "2", "admin@selfstorage.vn", "0909.999.000", "001200000001", "ADMIN", "Quản trị hệ thống", "Toàn hệ thống (HQ)", "HQ", "ACTIVE")
            );
            userRepository.saveAll(users);
            System.out.println("[DataInitializer] 👥 Đã nạp 6 tài khoản mẫu 5 Roles (customer/1, admin/2, staff/3, manager/4, business/5).");
        }
    }

    private void seedContracts() {
        if (contractRepository.count() == 0) {
            Contract c1 = new Contract();
            c1.setId("CTR-2026-001");
            c1.setUnitCode("A-102");
            c1.setCustomerName("Trần Văn Bảo");
            c1.setCustomerPhone("0987.654.321");
            c1.setStartDate("24/09/2026");
            c1.setEndDate("24/12/2026");
            c1.setDurationMonths(3);
            c1.setMonthlyFee(BigDecimal.valueOf(1450000));
            c1.setDepositFee(BigDecimal.valueOf(1450000));
            c1.setPinCode("842916");
            c1.setPhysicalLock("LOC-8812");
            c1.setRfidCard("CRD-0419");
            c1.setStatus("ACTIVE");

            contractRepository.save(c1);
        }
    }

    private void seedTasks() {
        if (dailyTaskRepository.count() == 0) {
            dailyTaskRepository.saveAll(Arrays.asList(
                    new DailyTask("TSK-101", "Bàn giao tiếp đón kho A-102", "Nguyễn Văn Tuấn", "15:00", "IN_PROGRESS"),
                    new DailyTask("TSK-102", "Nghiệm thu kho trả A-106", "Lê Thị Mai", "17:30", "PENDING"),
                    new DailyTask("TSK-103", "Vệ sinh chuyên sâu kho A-108", "Nguyễn Văn Tuấn", "14:30", "COMPLETED")
            ));
        }
    }

    private void seedAuditLogs() {
        if (auditLogRepository.count() == 0) {
            auditLogRepository.saveAll(Arrays.asList(
                    new AuditLog("12:35:10 Hôm nay", "Nguyễn Văn Tuấn", "STAFF", "HANDOVER_UNIT", "Hoàn tất bàn giao kho A-102 cho khách Trần Văn Bảo (RSV-8821)", "192.168.1.45", "SUCCESS"),
                    new AuditLog("12:15:02 Hôm nay", "Trần Văn Bảo", "CUSTOMER", "PAYMENT_CONFIRM", "Thanh toán cọc 1.450.000 VNĐ qua VietQR TxID: 998124", "113.190.23.8", "SUCCESS"),
                    new AuditLog("11:50:40 Hôm nay", "Phạm Hải Đăng", "FACILITY_MGR", "ASSIGN_UNIT", "Gán kho A-102 cho đơn đặt chỗ RSV-8821", "192.168.1.12", "SUCCESS"),
                    new AuditLog("10:30:15 Hôm nay", "Trần Văn Bảo", "CUSTOMER", "CREATE_RESERVATION", "Tạo đơn đặt giữ chỗ Kho M (5.0m²) tại Cầu Giấy", "113.190.23.8", "SUCCESS"),
                    new AuditLog("09:40:22 Hôm nay", "Đặng Hoàng Long", "OPS_MGR", "UPDATE_POLICY", "Cập nhật mức chiết khấu thuê 12 tháng lên 15%", "192.168.0.2", "SUCCESS"),
                    new AuditLog("08:15:00 Hôm nay", "Admin Hệ thống", "SYSTEM_ADMIN", "USER_LOGIN", "Đăng nhập vào bảng điều khiển quản trị tập trung", "192.168.0.1", "SUCCESS")
            ));
        }
    }
}
