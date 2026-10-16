package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.FacilityRepository;
import com.swp391.selfstorage.repository.PaymentRepository;
import com.swp391.selfstorage.repository.RefundRequestRepository;
import com.swp391.selfstorage.repository.ReservationRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import com.swp391.selfstorage.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final PaymentRepository paymentRepository;
    private final PolicyAnalyticsService policyAnalyticsService;
    private final TaskIncidentService taskIncidentService;
    private final RefundRequestRepository refundRequestRepository;

    public ReservationService(ReservationRepository reservationRepository, UnitRepository unitRepository,
            UserRepository userRepository, FacilityRepository facilityRepository, PaymentRepository paymentRepository,
            PolicyAnalyticsService policyAnalyticsService, TaskIncidentService taskIncidentService) {
        this(reservationRepository, unitRepository, userRepository, facilityRepository, paymentRepository,
                policyAnalyticsService, taskIncidentService, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ReservationService(ReservationRepository reservationRepository, UnitRepository unitRepository,
            UserRepository userRepository, FacilityRepository facilityRepository, PaymentRepository paymentRepository,
            PolicyAnalyticsService policyAnalyticsService, TaskIncidentService taskIncidentService,
            RefundRequestRepository refundRequestRepository) {
        this.reservationRepository = reservationRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.paymentRepository = paymentRepository;
        this.policyAnalyticsService = policyAnalyticsService;
        this.taskIncidentService = taskIncidentService;
        this.refundRequestRepository = refundRequestRepository;
    }

    public List<Reservation> getAllReservations(String username) {
        User actor = requireUser(username);
        return switch (actor.getRole()) {
            case "CUSTOMER" -> reservationRepository.findByUserId(actor.getId());
            case "STAFF" -> reservationRepository.findByFacilityCode(actor.getFacilityCode());
            case "FMANAGER", "FACILITY_MANAGER" -> reservationRepository.findByFacilityCode(actor.getFacilityCode());
            case "OPS_MGR", "OPS_MANAGER", "ADMIN", "SYSTEM_ADMIN" -> reservationRepository.findAll();
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role cannot view reservations");
        };
    }

    public Reservation getReservationById(String id, String username) {
        User actor = requireUser(username);
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if ("CUSTOMER".equals(actor.getRole()) && !actor.getId().equals(reservation.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        if (Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(actor.getRole())
                && !Objects.equals(actor.getFacilityCode(), reservation.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        if (!Set.of("CUSTOMER", "STAFF", "FMANAGER", "FACILITY_MANAGER", "OPS_MGR", "OPS_MANAGER", "ADMIN", "SYSTEM_ADMIN")
                .contains(actor.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role cannot view reservations");
        }
        return reservation;
    }

    public List<Reservation> lookup(String query, String username) {
        User actor = requireUser(username);
        String value = text(query, "query is required");
        List<Reservation> matches = new ArrayList<>();
        reservationRepository.findById(value).ifPresent(matches::add);
        if (matches.isEmpty()) {
            userRepository.findByPhone(value).ifPresent(user ->
                    matches.addAll(reservationRepository.findByUserId(user.getId())));
            userRepository.findByCccd(value).ifPresent(user ->
                    matches.addAll(reservationRepository.findByUserId(user.getId())));
        }
        return matches.stream().filter(rsv -> {
            if ("CUSTOMER".equals(actor.getRole())) return actor.getId().equals(rsv.getUserId());
            if (Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(actor.getRole())) {
                return Objects.equals(actor.getFacilityCode(), rsv.getFacilityCode());
            }
            return Set.of("OPS_MGR", "OPS_MANAGER", "ADMIN", "SYSTEM_ADMIN").contains(actor.getRole());
        }).distinct().toList();
    }

    public Map<String, Object> calculateCost(String unitType, int durationMonths) {
        validateDuration(durationMonths);
        BigDecimal monthlyRate = policyAnalyticsService.getBasePrice(unitType);
        BigDecimal discountRate = policyAnalyticsService.getDiscountRate(durationMonths);
        BigDecimal grossRent = monthlyRate.multiply(BigDecimal.valueOf(durationMonths));
        BigDecimal discountAmount = grossRent.multiply(discountRate).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal totalRent = grossRent.subtract(discountAmount);
        BigDecimal depositAmount = monthlyRate.multiply(BigDecimal.valueOf(policyAnalyticsService.getDepositMonths()));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("monthlyRate", monthlyRate);
        res.put("durationMonths", durationMonths);
        res.put("discountRate", discountRate);
        res.put("discountAmount", discountAmount);
        res.put("totalRent", totalRent);
        res.put("depositAmount", depositAmount);
        res.put("payNowAmount", depositAmount);
        return res;
    }

    @Transactional
    public Reservation createReservation(String username, Map<String, Object> data) {
        User customer = requireUser(username);
        if (!"CUSTOMER".equals(customer.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer role required");
        }
        String unitType = text(data.get("unitType"), "unitType is required").toUpperCase(Locale.ROOT);
        if (!Set.of("S", "M", "L", "CLIMATE").contains(unitType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported unit type");
        }
        Object requestedFacility = data.containsKey("facilityCode") ? data.get("facilityCode") : data.get("facility");
        String facilityInput = requestedFacility == null ? customer.getFacilityCode() : requestedFacility.toString();
        String facilityCode = facilityRepository.findById(facilityInput)
                .or(() -> facilityRepository.findByNameIgnoreCase(facilityInput))
                .map(facility -> facility.getCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facility not found"));
        if (unitRepository.findByFacilityCodeAndStatusAndType(facilityCode, "available", unitType).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No available unit matches this facility and type");
        }

        Reservation rsv = new Reservation();
        rsv.setId("RSV-" + UUID.randomUUID());
        rsv.setUserId(customer.getId());
        rsv.setCustomerName(customer.getName());
        rsv.setCustomerPhone(customer.getPhone());
        rsv.setFacilityCode(facilityCode);
        rsv.setUnitType(unitType);
        rsv.setUnitCode(null);

        Object durationObj = data.get("durationMonths");
        int duration = durationObj instanceof Number ? ((Number) durationObj).intValue() : 1;
        validateDuration(duration);
        rsv.setDurationMonths(duration);
        rsv.setStartDate(parseDate(data.get("startDate")));
        if (rsv.getStartDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate cannot be in the past");
        }
        rsv.setDepositAmount((BigDecimal) calculateCost(unitType, duration).get("depositAmount"));

        rsv.setStatus("PENDING_PAYMENT");
        rsv.setAppointment(data.get("appointment") == null ? null : data.get("appointment").toString());
        rsv.setCreatedAt(LocalDateTime.now());
        Reservation saved = reservationRepository.save(rsv);

        Payment depositInvoice = new Payment();
        depositInvoice.setId("INV-" + UUID.randomUUID());
        depositInvoice.setReservationId(saved.getId());
        depositInvoice.setCustomerName(customer.getName());
        depositInvoice.setInvoiceType("DEPOSIT");
        depositInvoice.setAmount(saved.getDepositAmount());
        depositInvoice.setPaymentMethod("VietQR Napas247");
        depositInvoice.setStatus("PENDING");
        depositInvoice.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(depositInvoice);
        return saved;
    }

    @Transactional
    public Reservation cancelReservation(String customerUsername, String reservationId) {
        User customer = requireUser(customerUsername);
        Reservation reservation = reservationRepository.findByIdForUpdate(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if (!"CUSTOMER".equals(customer.getRole()) || !customer.getId().equals(reservation.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        if (!Set.of("PENDING_PAYMENT", "RESERVED").contains(reservation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation cannot be cancelled at this stage");
        }
        if (reservation.getUnitCode() != null) {
            unitRepository.findByIdForUpdate(reservation.getUnitCode()).ifPresent(unit -> {
                unit.setStatus("available");
                unit.setTenantName(null);
                unit.setPinCode("000000");
                unitRepository.save(unit);
            });
        }
        reservation.setStatus("CANCELLED");
        Reservation saved = reservationRepository.save(reservation);
        paymentRepository.findByReservationIdAndStatus(reservationId, "PENDING").forEach(payment -> {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
        });
        paymentRepository.findByReservationIdAndInvoiceTypeAndStatus(reservationId, "DEPOSIT", "PAID")
                .ifPresent(deposit -> {
                    if (refundRequestRepository == null) return;
                    com.swp391.selfstorage.entity.RefundRequest refund = new com.swp391.selfstorage.entity.RefundRequest();
                    refund.setId("REF-" + UUID.randomUUID());
                    refund.setReservationId(reservationId);
                    refund.setFacilityCode(reservation.getFacilityCode());
                    refund.setPaymentId(deposit.getId());
                    refund.setApprovedAmount(deposit.getAmount());
                    refund.setStatus("PENDING");
                    // Reservation refunds are approved through the reservation endpoint.
                    refundRequestRepository.save(refund);
                });
        return saved;
    }

    @Transactional
    public Reservation assignUnit(String managerUsername, String rsvId, String unitCode) {
        User manager = requireUser(managerUsername);
        if (!Set.of("FMANAGER", "FACILITY_MANAGER").contains(manager.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility manager role required");
        }
        if (manager.getFacilityCode() == null || manager.getFacilityCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User has no facility scope");
        }
        Reservation rsv = reservationRepository.findByIdForUpdate(rsvId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if (!manager.getFacilityCode().equals(rsv.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found in this facility");
        }
        if (!"RESERVED".equals(rsv.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation must have a paid deposit before assignment");
        }
        Payment deposit = paymentRepository.findByReservationIdAndInvoiceTypeAndStatus(
                        rsvId, "DEPOSIT", "PAID")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Deposit is not paid"));
        Unit unit = unitRepository.findByIdForUpdate(unitCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        if (!manager.getFacilityCode().equals(unit.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found in this facility");
        }
        if (!rsv.getUnitType().equalsIgnoreCase(unit.getType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unit type does not match reservation");
        }
        if (!"available".equalsIgnoreCase(unit.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unit is not available");
        }
        rsv.setUnitCode(unitCode);
        unit.setStatus("reserved");
        unit.setTenantName(rsv.getCustomerName());
        unit.setPinCode("000000");
        unitRepository.save(unit);
        Reservation saved = reservationRepository.save(rsv);
        taskIncidentService.createSystemTask(rsv.getFacilityCode(),
                "Check-in appointment for reservation " + rsv.getId(), "CHECKIN",
                unitCode, rsv.getId(), null, rsv.getStartDate());
        return saved;
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private static void validateDuration(int duration) {
        if (duration < 1 || duration > 36) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "durationMonths must be between 1 and 36");
        }
    }

    private static LocalDate parseDate(Object value) {
        if (value == null || value.toString().isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(value.toString());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must use yyyy-MM-dd format");
        }
    }

    private static String text(Object value, String message) {
        if (value == null || value.toString().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        return value.toString().trim();
    }
}
