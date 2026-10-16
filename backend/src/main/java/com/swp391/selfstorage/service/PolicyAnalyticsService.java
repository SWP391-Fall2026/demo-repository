package com.swp391.selfstorage.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.entity.BusinessPolicy;
import com.swp391.selfstorage.entity.Facility;
import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.BusinessPolicyRepository;
import com.swp391.selfstorage.repository.ContractRepository;
import com.swp391.selfstorage.repository.FacilityRepository;
import com.swp391.selfstorage.repository.PaymentRepository;
import com.swp391.selfstorage.repository.ReservationRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import com.swp391.selfstorage.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PolicyAnalyticsService {
    private static final Set<String> POLICY_KEYS = Set.of(
            "basePrices", "depositRule", "durationDiscounts", "extraFees", "gracePeriodDays");

    private final BusinessPolicyRepository policyRepository;
    private final FacilityRepository facilityRepository;
    private final UnitRepository unitRepository;
    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public PolicyAnalyticsService(BusinessPolicyRepository policyRepository,
            FacilityRepository facilityRepository, UnitRepository unitRepository,
            PaymentRepository paymentRepository, ReservationRepository reservationRepository,
            ContractRepository contractRepository, UserRepository userRepository, ObjectMapper objectMapper) {
        this.policyRepository = policyRepository;
        this.facilityRepository = facilityRepository;
        this.unitRepository = unitRepository;
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> getPricingPolicies() {
        Map<String, Object> defaults = defaultPolicies();
        Map<String, Object> policies = new LinkedHashMap<>();
        defaults.forEach((key, defaultValue) -> {
            BusinessPolicy record = policyRepository.findById(key).orElseGet(() ->
                    policyRepository.save(new BusinessPolicy(key, writeJson(defaultValue), "SYSTEM")));
            policies.put(key, readJson(record.getPolicyValue()));
        });
        return policies;
    }

    @Transactional
    public Map<String, Object> updatePricingPolicies(Map<String, Object> updates, String updatedBy) {
        if (updates == null || updates.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one policy value is required");
        }
        Map<String, Object> current = getPricingPolicies();
        for (Map.Entry<String, Object> entry : updates.entrySet()) {
            if (!POLICY_KEYS.contains(entry.getKey())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported policy key: " + entry.getKey());
            }
            Object value = validatePolicyValue(entry.getKey(), entry.getValue(), current.get(entry.getKey()));
            policyRepository.save(new BusinessPolicy(entry.getKey(), writeJson(value), updatedBy));
        }
        return getPricingPolicies();
    }

    @Transactional
    public BigDecimal getBasePrice(String unitType) {
        Object configured = mapValue(getPricingPolicies().get("basePrices"), unitType);
        if (!(configured instanceof Number number) || number.doubleValue() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No price configured for unit type");
        }
        return BigDecimal.valueOf(number.doubleValue());
    }

    @Transactional
    public BigDecimal getDiscountRate(int durationMonths) {
        Object configured = mapValue(getPricingPolicies().get("durationDiscounts"), String.valueOf(durationMonths));
        if (!(configured instanceof Number number)) return BigDecimal.ZERO;
        return BigDecimal.valueOf(number.doubleValue());
    }

    @Transactional
    public int getDepositMonths() {
        Object configured = getPricingPolicies().get("depositRule");
        if (!(configured instanceof String rule) || !rule.matches("[1-9][0-9]*_MONTHS?")) return 1;
        return Integer.parseInt(rule.substring(0, rule.indexOf('_')));
    }

    @Transactional
    public BigDecimal getExtraFee(String feeKey) {
        Object configured = mapValue(getPricingPolicies().get("extraFees"), feeKey);
        if (!(configured instanceof Number number) || number.doubleValue() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No fee configured for " + feeKey);
        }
        return BigDecimal.valueOf(number.doubleValue());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getChainStats() {
        return getChainStats(YearMonth.now());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getChainStats(YearMonth month) {
        long totalUnits = 0;
        long occupiedUnits = 0;
        long availableUnits = 0;
        long reservedUnits = 0;
        BigDecimal monthlyRevenue = BigDecimal.ZERO;
        BigDecimal heldDeposits = BigDecimal.ZERO;
        Map<String, BigDecimal> revenueBySource = new LinkedHashMap<>();
        List<Map<String, Object>> facilityReports = facilityRepository.findAll().stream()
                .map(facility -> calculateFacilityReport(facility, month)).toList();
        for (Map<String, Object> report : facilityReports) {
            totalUnits += number(report.get("totalUnits"));
            occupiedUnits += number(report.get("occupiedUnits"));
            availableUnits += number(report.get("availableUnits"));
            reservedUnits += number(report.get("reservedUnits"));
            monthlyRevenue = monthlyRevenue.add(amount(report.get("monthlyRevenue")));
            heldDeposits = heldDeposits.add(amount(report.get("heldDepositFunds")));
            @SuppressWarnings("unchecked")
            Map<String, BigDecimal> branchSources = (Map<String, BigDecimal>) report.get("revenueBySource");
            branchSources.forEach((source, value) -> revenueBySource.merge(source, value, BigDecimal::add));
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("month", month.toString());
        stats.put("totalBranches", facilityReports.size());
        stats.put("totalUnits", totalUnits);
        stats.put("occupiedUnits", occupiedUnits);
        stats.put("availableUnits", availableUnits);
        stats.put("reservedUnits", reservedUnits);
        stats.put("occupancyRate", formatRate(occupiedUnits, totalUnits));
        stats.put("monthlyRevenue", monthlyRevenue);
        stats.put("heldDepositFunds", heldDeposits);
        stats.put("revenueBySource", revenueBySource);
        stats.put("facilities", facilityReports);
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFacilityStats(String username, YearMonth month) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!Set.of("FMANAGER", "FACILITY_MANAGER").contains(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility manager role required");
        }
        if (user.getFacilityCode() == null || user.getFacilityCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User has no facility scope");
        }
        Facility facility = facilityRepository.findById(user.getFacilityCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facility not found"));
        return calculateFacilityReport(facility, month);
    }

    private Map<String, Object> calculateFacilityReport(Facility facility, YearMonth month) {
        List<Unit> units = unitRepository.findByFacilityCode(facility.getCode());
        long available = countStatus(units, "available");
        long reserved = countStatus(units, "reserved");
        long occupied = countStatus(units, "occupied");
        long maintenance = countStatus(units, "maintenance");
        long cleaning = countStatus(units, "cleaning");
        Map<String, BigDecimal> revenueBySource = new LinkedHashMap<>();
        LocalDateTime start = month.atDay(1).atStartOfDay();
        LocalDateTime end = month.plusMonths(1).atDay(1).atStartOfDay();
        for (Payment payment : paymentRepository.findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end)) {
            if (!isPaid(payment.getStatus()) || !facility.getCode().equals(paymentFacilityCode(payment))) continue;
            revenueBySource.merge(payment.getInvoiceType(), amount(payment.getAmount()), BigDecimal::add);
        }
        BigDecimal revenue = revenueBySource.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal heldDeposits = heldDepositFunds(facility.getCode());

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("facilityCode", facility.getCode());
        report.put("facilityName", facility.getName());
        report.put("month", month.toString());
        report.put("totalUnits", units.size());
        report.put("availableUnits", available);
        report.put("reservedUnits", reserved);
        report.put("occupiedUnits", occupied);
        report.put("maintenanceUnits", maintenance);
        report.put("cleaningUnits", cleaning);
        report.put("occupancyRate", formatRate(occupied, units.size()));
        report.put("monthlyRevenue", revenue);
        report.put("heldDepositFunds", heldDeposits);
        report.put("revenueBySource", revenueBySource);
        return report;
    }

    private String paymentFacilityCode(Payment payment) {
        if (payment.getReservationId() != null) {
            Reservation reservation = reservationRepository.findById(payment.getReservationId()).orElse(null);
            if (reservation != null) return reservation.getFacilityCode();
        }
        if (payment.getContractId() != null) {
            return contractRepository.findById(payment.getContractId())
                    .map(contract -> contract.getFacilityCode()).orElse(null);
        }
        return null;
    }

    private BigDecimal heldDepositFunds(String facilityCode) {
        BigDecimal held = BigDecimal.ZERO;
        for (Payment payment : paymentRepository.findByInvoiceTypeAndStatus("DEPOSIT", "PAID")) {
            if (payment.getReservationId() == null) continue;
            Reservation reservation = reservationRepository.findById(payment.getReservationId()).orElse(null);
            if (reservation == null || !facilityCode.equals(reservation.getFacilityCode())) continue;
            boolean heldByReservation = Set.of("RESERVED", "CHECKED_IN").contains(reservation.getStatus());
            boolean heldByActiveContract = contractRepository.findByReservationId(reservation.getId())
                    .map(contract -> Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(contract.getStatus())).orElse(false);
            if (heldByReservation || heldByActiveContract) held = held.add(amount(payment.getAmount()));
        }
        return held;
    }

    private static Map<String, Object> defaultPolicies() {
        Map<String, Object> prices = new LinkedHashMap<>();
        prices.put("S", 800000L);
        prices.put("M", 1450000L);
        prices.put("L", 2800000L);
        prices.put("CLIMATE", 2200000L);
        Map<String, Object> discounts = new LinkedHashMap<>();
        discounts.put("3", 0.05);
        discounts.put("6", 0.10);
        discounts.put("12", 0.15);
        Map<String, Object> fees = new LinkedHashMap<>();
        fees.put("cleaning", 200000L);
        fees.put("newLock", 150000L);
        fees.put("overduePenaltyPerDay", 50000L);
        Map<String, Object> defaults = new LinkedHashMap<>();
        defaults.put("basePrices", prices);
        defaults.put("depositRule", "1_MONTH");
        defaults.put("durationDiscounts", discounts);
        defaults.put("extraFees", fees);
        defaults.put("gracePeriodDays", 3);
        return defaults;
    }

    private static Object validatePolicyValue(String key, Object value, Object current) {
        if ("depositRule".equals(key)) {
            if (!(value instanceof String text) || !text.matches("[1-9][0-9]*_MONTHS?")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid depositRule");
            }
            return text;
        }
        if ("gracePeriodDays".equals(key)) {
            if (!(value instanceof Number number) || number.intValue() < 0 || number.intValue() > 30) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "gracePeriodDays must be between 0 and 30");
            }
            return number.intValue();
        }
        if (!(value instanceof Map<?, ?> values) || !(current instanceof Map<?, ?> currentValues)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " must be an object");
        }
        Map<String, Object> merged = new LinkedHashMap<>();
        currentValues.forEach((field, existing) -> merged.put(String.valueOf(field), existing));
        values.forEach((field, input) -> {
            String name = String.valueOf(field);
            boolean allowed = switch (key) {
                case "basePrices" -> Set.of("S", "M", "L", "CLIMATE").contains(name);
                case "durationDiscounts" -> Set.of("3", "6", "12").contains(name);
                case "extraFees" -> Set.of("cleaning", "newLock", "overduePenaltyPerDay").contains(name);
                default -> false;
            };
            if (!allowed) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported policy item: " + name);
            if (!(input instanceof Number number)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + "." + name + " must be numeric");
            }
            BigDecimal amount = BigDecimal.valueOf(number.doubleValue());
            if ("durationDiscounts".equals(key)) {
                if (amount.compareTo(BigDecimal.ZERO) < 0 || amount.compareTo(BigDecimal.ONE) >= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Discount must be in [0, 1)");
                }
                merged.put(name, amount.doubleValue());
            } else {
                if (amount.compareTo(BigDecimal.ZERO) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policy values cannot be negative");
                }
                merged.put(name, amount.longValue());
            }
        });
        return merged;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize policy", exception);
        }
    }

    private Object readJson(String value) {
        try {
            return objectMapper.readValue(value, Object.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored policy is invalid JSON", exception);
        }
    }

    private static boolean isPaid(String status) {
        return "PAID".equalsIgnoreCase(status) || "SUCCESS".equalsIgnoreCase(status);
    }

    private static long countStatus(List<Unit> units, String status) {
        return units.stream().filter(unit -> status.equalsIgnoreCase(unit.getStatus())).count();
    }

    private static Object mapValue(Object value, String key) {
        return value instanceof Map<?, ?> map ? map.get(key) : null;
    }

    private static String formatRate(long occupied, long total) {
        return total == 0 ? "0.0%" : String.format(Locale.ROOT, "%.1f%%", occupied * 100.0 / total);
    }

    private static long number(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private static BigDecimal amount(Object value) {
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return BigDecimal.ZERO;
    }
}
