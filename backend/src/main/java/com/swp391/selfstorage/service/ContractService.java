package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.entity.HandoverRecord;
import com.swp391.selfstorage.entity.InspectionRecord;
import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.entity.RefundRequest;
import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.ContractRepository;
import com.swp391.selfstorage.repository.HandoverRecordRepository;
import com.swp391.selfstorage.repository.InspectionRecordRepository;
import com.swp391.selfstorage.repository.PaymentRepository;
import com.swp391.selfstorage.repository.RefundRequestRepository;
import com.swp391.selfstorage.repository.ReservationRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import com.swp391.selfstorage.repository.UserRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ContractService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final UnitRepository unitRepository;
    private final PaymentRepository paymentRepository;
    private final HandoverRecordRepository handoverRepository;
    private final InspectionRecordRepository inspectionRepository;
    private final RefundRequestRepository refundRepository;
    private final UserRepository userRepository;
    private final TaskIncidentService taskIncidentService;
    private final PolicyAnalyticsService policyAnalyticsService;

    public ContractService(ContractRepository contractRepository, ReservationRepository reservationRepository,
            UnitRepository unitRepository, PaymentRepository paymentRepository,
            HandoverRecordRepository handoverRepository, InspectionRecordRepository inspectionRepository,
            RefundRequestRepository refundRepository, UserRepository userRepository,
            TaskIncidentService taskIncidentService, PolicyAnalyticsService policyAnalyticsService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.unitRepository = unitRepository;
        this.paymentRepository = paymentRepository;
        this.handoverRepository = handoverRepository;
        this.inspectionRepository = inspectionRepository;
        this.refundRepository = refundRepository;
        this.userRepository = userRepository;
        this.taskIncidentService = taskIncidentService;
        this.policyAnalyticsService = policyAnalyticsService;
    }

    public List<Contract> getAllContracts(String username) {
        User actor = requireUser(username);
        return switch (actor.getRole()) {
            case "CUSTOMER" -> contractRepository.findByUserId(actor.getId());
            case "STAFF", "FMANAGER", "FACILITY_MANAGER" -> contractRepository.findByFacilityCode(actor.getFacilityCode());
            case "OPS_MGR", "OPS_MANAGER", "ADMIN", "SYSTEM_ADMIN" -> contractRepository.findAll();
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role cannot view contracts");
        };
    }

    public Contract getContractByUnit(String unitCode) {
        return contractRepository.findByUnitCode(unitCode).orElse(null);
    }

    public boolean verifyPin(String username, String unitCode, String pin) {
        User actor = requireUser(username);
        Contract contract = contractRepository.findByUnitCode(unitCode).orElse(null);
        if (pin == null || unitCode == null) return false;
        if (contract == null) {
            Unit unit = unitRepository.findById(unitCode).orElse(null);
            return unit != null
                    && Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(actor.getRole())
                    && Objects.equals(actor.getFacilityCode(), unit.getFacilityCode())
                    && Objects.equals(unit.getTemporaryPin(), pin)
                    && unit.getTemporaryPinExpiresAt() != null
                    && unit.getTemporaryPinExpiresAt().isAfter(LocalDateTime.now());
        }
        boolean regularPin = Set.of("ACTIVE", "EXPIRING_SOON").contains(contract.getStatus())
                && Objects.equals(contract.getPinCode(), pin);
        if (!regularPin) {
            Unit unit = unitRepository.findById(unitCode).orElse(null);
            if (unit == null || !Objects.equals(unit.getTemporaryPin(), pin)
                    || unit.getTemporaryPinExpiresAt() == null
                    || unit.getTemporaryPinExpiresAt().isBefore(LocalDateTime.now())) return false;
        }
        if ("CUSTOMER".equals(actor.getRole())) return actor.getId().equals(contract.getUserId());
        return Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(actor.getRole())
                && Objects.equals(actor.getFacilityCode(), contract.getFacilityCode());
    }

    @Transactional
    public Contract updatePin(String username, String unitCode, String newPin) {
        User customer = requireUser(username);
        Contract contract = contractRepository.findByUnitCodeForUpdate(unitCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (!"CUSTOMER".equals(customer.getRole()) || !customer.getId().equals(contract.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found");
        }
        if (!Set.of("ACTIVE", "EXPIRING_SOON").contains(contract.getStatus())
                || newPin == null || !newPin.matches("[0-9]{6}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An active contract and six-digit PIN are required");
        }
        contract.setPinCode(newPin);
        Unit unit = unitRepository.findByIdForUpdate(unitCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        unit.setPinCode(newPin);
        unitRepository.save(unit);
        return contractRepository.save(contract);
    }

    @Transactional
    public Contract completeHandover(String staffUsername, Map<String, Object> data) {
        User staff = requireStaff(staffUsername);
        String reservationId = requiredText(data.get("reservationId"), "reservationId is required");
        Reservation reservation = reservationRepository.findByIdForUpdate(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if (!staff.getFacilityCode().equals(reservation.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found in this facility");
        }
        if (!"RESERVED".equals(reservation.getStatus()) || reservation.getUnitCode() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation must be paid and assigned before handover");
        }
        if (!Boolean.parseBoolean(Objects.toString(data.get("customerSignatureConfirmed"), "false"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer handover confirmation is required");
        }
        paymentRepository.findByReservationIdAndInvoiceTypeAndStatus(reservationId, "DEPOSIT", "PAID")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Deposit is not paid"));
        paymentRepository.findByReservationIdAndInvoiceTypeAndStatus(reservationId, "RENT", "PAID")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "First month rent is not paid"));

        Unit unit = unitRepository.findByIdForUpdate(reservation.getUnitCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assigned Unit not found"));
        if (!"reserved".equalsIgnoreCase(unit.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assigned Unit is not reserved");
        }
        if (contractRepository.findByUnitCode(unit.getCode()).filter(existing ->
                !"TERMINATED".equals(existing.getStatus())).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unit already has an active contract");
        }

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(reservation.getDurationMonths());
        String pin = generatePin();
        Contract contract = new Contract();
        contract.setId("CTR-" + UUID.randomUUID());
        contract.setReservationId(reservation.getId());
        contract.setUserId(reservation.getUserId());
        contract.setCustomerName(reservation.getCustomerName());
        contract.setCustomerPhone(reservation.getCustomerPhone());
        contract.setFacilityCode(reservation.getFacilityCode());
        contract.setUnitCode(unit.getCode());
        contract.setStartDate(startDate);
        contract.setEndDate(endDate);
        contract.setDurationMonths(reservation.getDurationMonths());
        contract.setMonthlyFee(unit.getPricePerMonth());
        contract.setDepositFee(reservation.getDepositAmount());
        contract.setPinCode(pin);
        contract.setPhysicalLock(Objects.toString(data.get("lock"), null));
        contract.setRfidCard(Objects.toString(data.get("rfid"), null));
        contract.setStatus("ACTIVE");
        contract.setCreatedAt(LocalDateTime.now());
        Contract saved = contractRepository.save(contract);

        unit.setStatus("occupied");
        unit.setTenantName(reservation.getCustomerName());
        unit.setPinCode(pin);
        unitRepository.save(unit);
        reservation.setStatus("CHECKED_IN");
        reservationRepository.save(reservation);

        HandoverRecord record = new HandoverRecord();
        record.setId("HND-" + UUID.randomUUID());
        record.setContractId(saved.getId());
        record.setReservationId(reservation.getId());
        record.setStaffId(staff.getId());
        record.setHandoverDate(LocalDateTime.now());
        record.setLockType(Objects.toString(data.get("lock"), null));
        record.setUnitConditionNotes(Objects.toString(data.get("unitConditionNotes"), ""));
        record.setCustomerSignatureConfirmed(true);
        handoverRepository.save(record);
        taskIncidentService.completeReferenceTasks(reservation.getId(), null);
        return saved;
    }

    @Transactional
    public Contract requestCheckout(String customerUsername, String contractId, LocalDate requestedDate) {
        User customer = requireUser(customerUsername);
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (!"CUSTOMER".equals(customer.getRole()) || !customer.getId().equals(contract.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found");
        }
        if (!Set.of("ACTIVE", "EXPIRING_SOON").contains(contract.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active contracts can request checkout");
        }
        if (requestedDate != null && requestedDate.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Checkout date cannot be in the past");
        }
        if (contract.getCheckoutRequestedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout has already been requested");
        }
        contract.setCheckoutRequestedAt(LocalDateTime.now());
        contract.setCheckoutRequestedDate(requestedDate == null ? LocalDate.now() : requestedDate);
        Contract saved = contractRepository.save(contract);
        taskIncidentService.createSystemTask(contract.getFacilityCode(), "Inspect return for contract " + contract.getId(),
                "RETURN", contract.getUnitCode(), null, contract.getId(), contract.getCheckoutRequestedDate());
        return saved;
    }

    @Transactional
    public Map<String, Object> returnInspection(String staffUsername, String unitCode, Map<String, Object> data) {
        User staff = requireStaff(staffUsername);
        Contract contract = contractRepository.findByUnitCodeForUpdate(unitCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (!staff.getFacilityCode().equals(contract.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found in this facility");
        }
        if (contract.getCheckoutRequestedAt() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Customer must request checkout before inspection");
        }
        String cleanlinessStatus = Objects.toString(data.get("cleanlinessStatus"), "UNKNOWN");
        boolean dirty = Set.of("DIRTY", "NEEDS_CLEANING").contains(cleanlinessStatus.toUpperCase());
        boolean lockDamaged = Boolean.parseBoolean(Objects.toString(data.get("lockDamaged"), "false"));
        BigDecimal deductions = BigDecimal.ZERO;
        if (dirty) deductions = deductions.add(policyAnalyticsService.getExtraFee("cleaning"));
        if (lockDamaged) deductions = deductions.add(policyAnalyticsService.getExtraFee("newLock"));
        BigDecimal deposit = contract.getDepositFee() == null ? BigDecimal.ZERO : contract.getDepositFee();
        BigDecimal refund = deposit.subtract(deductions).max(BigDecimal.ZERO);

        InspectionRecord inspection = new InspectionRecord();
        inspection.setId("INS-" + UUID.randomUUID());
        inspection.setContractId(contract.getId());
        inspection.setStaffId(staff.getId());
        inspection.setInspectionDate(LocalDateTime.now());
        inspection.setCleanlinessStatus(cleanlinessStatus);
        inspection.setDamageNotes(Objects.toString(data.get("damageNotes"), ""));
        inspection.setPenaltyFee(deductions);
        inspection.setDepositRefundAmount(refund);
        inspection.setCleared(deductions.signum() == 0
                && "CLEAN".equalsIgnoreCase(inspection.getCleanlinessStatus()));
        InspectionRecord savedInspection = inspectionRepository.save(inspection);

        RefundRequest refundRequest = new RefundRequest();
        refundRequest.setId("REF-" + UUID.randomUUID());
        refundRequest.setContractId(contract.getId());
        refundRequest.setInspectionId(savedInspection.getId());
        refundRequest.setFacilityCode(contract.getFacilityCode());
        refundRequest.setApprovedAmount(refund);
        refundRequest.setStatus("PENDING");
        refundRepository.save(refundRequest);

        contract.setStatus("TERMINATED");
        contract.setPinCode(null);
        contractRepository.save(contract);
        Unit unit = unitRepository.findByIdForUpdate(unitCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        unit.setPinCode("000000");
        unit.setStatus("cleaning");
        unitRepository.save(unit);
        taskIncidentService.completeReferenceTasks(null, contract.getId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("contractId", contract.getId());
        result.put("inspectionId", savedInspection.getId());
        result.put("depositAmount", deposit);
        result.put("deductions", deductions);
        result.put("refundAmount", refund);
        result.put("refundStatus", "PENDING");
        result.put("status", "TERMINATED");
        return result;
    }

    public Map<String, Object> getRenewalQuote(String customerUsername, String contractId, int months) {
        User customer = requireUser(customerUsername);
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (!"CUSTOMER".equals(customer.getRole()) || !customer.getId().equals(contract.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found");
        }
        if (!Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(contract.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contract cannot be renewed in its current state");
        }
        if (months < 1 || months > 36) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "durationMonths must be between 1 and 36");
        }
        BigDecimal monthly = contract.getMonthlyFee() == null ? BigDecimal.ZERO : contract.getMonthlyFee();
        BigDecimal gross = monthly.multiply(BigDecimal.valueOf(months));
        BigDecimal discount = gross.multiply(policyAnalyticsService.getDiscountRate(months));
        BigDecimal overdueFee = BigDecimal.ZERO;
        if ("OVERDUE".equals(contract.getStatus())) {
            LocalDate end = contract.getEndDate() == null ? LocalDate.now() : contract.getEndDate();
            long days = Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(end, LocalDate.now()));
            overdueFee = policyAnalyticsService.getExtraFee("overduePenaltyPerDay")
                    .multiply(BigDecimal.valueOf(days));
        }
        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("contractId", contract.getId());
        quote.put("durationMonths", months);
        quote.put("monthlyFee", monthly);
        quote.put("grossAmount", gross);
        quote.put("discountAmount", discount);
        quote.put("overdueFee", overdueFee);
        quote.put("totalAmount", gross.subtract(discount).add(overdueFee).max(BigDecimal.ZERO));
        quote.put("currentEndDate", contract.getEndDate());
        return quote;
    }

    @Transactional
    public RefundRequest approveRefund(String managerUsername, String contractId) {
        User manager = requireManager(managerUsername);
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (!manager.getFacilityCode().equals(contract.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found in this facility");
        }
        RefundRequest refund = refundRepository.findByContractIdAndStatus(contractId, "PENDING")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "No pending refund request"));
        InspectionRecord inspection = inspectionRepository.findById(refund.getInspectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Inspection record missing"));
        refund.setStatus("COMPLETED");
        refund.setCompletedAt(LocalDateTime.now());
        RefundRequest saved = refundRepository.save(refund);

        Payment refundPayment = new Payment();
        refundPayment.setId("TXN-" + UUID.randomUUID());
        refundPayment.setContractId(contract.getId());
        refundPayment.setCustomerName(contract.getCustomerName());
        refundPayment.setInvoiceType("EXTRA");
        refundPayment.setAmount(refund.getApprovedAmount().negate());
        refundPayment.setPaymentMethod("REFUND");
        refundPayment.setTransactionCode("REF-" + UUID.randomUUID());
        refundPayment.setStatus("PAID");
        refundPayment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(refundPayment);

        Unit unit = unitRepository.findByIdForUpdate(contract.getUnitCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        unit.setTenantName(null);
        unit.setPinCode("000000");
        unit.setStatus(inspection.isCleared() ? "available" : "cleaning");
        unitRepository.save(unit);
        return saved;
    }

    @Transactional
    public RefundRequest approveReservationRefund(String managerUsername, String reservationId) {
        User manager = requireManager(managerUsername);
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if (!manager.getFacilityCode().equals(reservation.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found in this facility");
        }
        RefundRequest refund = refundRepository.findByReservationIdAndStatus(reservationId, "PENDING")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "No pending refund request"));
        refund.setStatus("COMPLETED");
        refund.setCompletedAt(LocalDateTime.now());
        RefundRequest saved = refundRepository.save(refund);

        Payment refundPayment = new Payment();
        refundPayment.setId("TXN-" + UUID.randomUUID());
        refundPayment.setReservationId(reservationId);
        refundPayment.setCustomerName(reservation.getCustomerName());
        refundPayment.setInvoiceType("EXTRA");
        refundPayment.setAmount(refund.getApprovedAmount().negate());
        refundPayment.setPaymentMethod("REFUND");
        refundPayment.setTransactionCode("REF-" + UUID.randomUUID());
        refundPayment.setStatus("PAID");
        refundPayment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(refundPayment);
        return saved;
    }

    public List<RefundRequest> getPendingRefunds(String managerUsername) {
        User manager = requireManager(managerUsername);
        return refundRepository.findByFacilityCodeAndStatusOrderByCreatedAtAsc(
                manager.getFacilityCode(), "PENDING");
    }

    @Transactional
    public Contract lockOverdueContract(String managerUsername, String contractId) {
        User manager = requireManager(managerUsername);
        Contract contract = contractRepository.findByIdForUpdate(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        if (!manager.getFacilityCode().equals(contract.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found in this facility");
        }
        if (!Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(contract.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contract cannot be locked");
        }
        contract.setStatus("OVERDUE");
        contract.setPinCode(null);
        contractRepository.save(contract);
        unitRepository.findByIdForUpdate(contract.getUnitCode()).ifPresent(unit -> {
            unit.setPinCode("000000");
            unitRepository.save(unit);
        });
        return contract;
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private User requireStaff(String username) {
        User staff = requireUser(username);
        if (!Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(staff.getRole())
                || staff.getFacilityCode() == null || staff.getFacilityCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility staff role and scope required");
        }
        return staff;
    }

    private User requireManager(String username) {
        User manager = requireUser(username);
        if (!Set.of("FMANAGER", "FACILITY_MANAGER").contains(manager.getRole())
                || manager.getFacilityCode() == null || manager.getFacilityCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility manager role and scope required");
        }
        return manager;
    }

    private static BigDecimal decimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        try {
            return new BigDecimal(value.toString());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid monetary amount");
        }
    }

    private static String requiredText(Object value, String message) {
        if (value == null || value.toString().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        return value.toString().trim();
    }

    private static String generatePin() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

}
