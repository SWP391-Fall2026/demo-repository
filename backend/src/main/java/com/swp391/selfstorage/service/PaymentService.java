package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.PaymentRepository;
import com.swp391.selfstorage.repository.ContractRepository;
import com.swp391.selfstorage.repository.ReservationRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import com.swp391.selfstorage.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final PolicyAnalyticsService policyAnalyticsService;

    public PaymentService(PaymentRepository paymentRepository, ReservationRepository reservationRepository,
            UnitRepository unitRepository, UserRepository userRepository) {
        this(paymentRepository, reservationRepository, unitRepository, userRepository, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public PaymentService(PaymentRepository paymentRepository, ReservationRepository reservationRepository,
            UnitRepository unitRepository, UserRepository userRepository,
            ContractRepository contractRepository, PolicyAnalyticsService policyAnalyticsService) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.contractRepository = contractRepository;
        this.policyAnalyticsService = policyAnalyticsService;
    }

    public Map<String, String> getBankInfo() {
        Map<String, String> bank = new LinkedHashMap<>();
        bank.put("bankName", "Ngân hàng TMCP Quân Đội (MBBank)");
        bank.put("accountNo", "0988 7766 5522");
        bank.put("accountName", "CONG TY CP SELF STORAGE VIET NAM");
        bank.put("gateway", "VietQR / Napas247");
        return bank;
    }

    public List<Payment> getTransactions(String username) {
        User user = requireUser(username);
        if (Set.of("OPS_MGR", "OPS_MANAGER", "ADMIN", "SYSTEM_ADMIN").contains(user.getRole())) {
            return paymentRepository.findAll();
        }
        if ("CUSTOMER".equals(user.getRole())) {
            Set<String> reservationIds = reservationRepository.findByUserId(user.getId()).stream()
                    .map(Reservation::getId).collect(java.util.stream.Collectors.toSet());
            Set<String> contractIds = contractRepository == null ? Set.of() : contractRepository.findByUserId(user.getId()).stream()
                    .map(Contract::getId).collect(java.util.stream.Collectors.toSet());
            return paymentRepository.findAll().stream()
                    .filter(payment -> reservationIds.contains(payment.getReservationId())
                            || contractIds.contains(payment.getContractId()))
                    .toList();
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role cannot view payment transactions");
    }

    @Transactional
    public Payment simulatePayment(String username, Map<String, Object> data, String forcedType) {
        User customer = requireUser(username);
        if (!"CUSTOMER".equals(customer.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer role required");
        }
        String invoiceType = forcedType == null
                ? Objects.toString(data.getOrDefault("type", "DEPOSIT")).toUpperCase(Locale.ROOT)
                : forcedType;

        String reservationId = data.get("reservationId") == null ? null : data.get("reservationId").toString();
        Reservation reservation = null;
        if ("DEPOSIT".equals(invoiceType) || "RENT".equals(invoiceType)) {
            reservationId = requiredText(reservationId, "reservationId is required");
            reservation = reservationRepository.findByIdForUpdate(reservationId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
            if (!customer.getId().equals(reservation.getUserId())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
            }
        }

        Payment payment;
        if ("DEPOSIT".equals(invoiceType)) {
            if (!"PENDING_PAYMENT".equals(reservation.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Reservation is not awaiting a deposit");
            }
            payment = paymentRepository.findByReservationIdAndInvoiceTypeAndStatus(
                            reservationId, "DEPOSIT", "PENDING")
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deposit invoice not found"));
            assertAmount(data.get("amount"), payment.getAmount());
            payment.setStatus("PAID");
            reservation.setStatus("RESERVED");
            reservationRepository.save(reservation);
        } else if ("RENT".equals(invoiceType)) {
            if (!"RESERVED".equals(reservation.getStatus()) || reservation.getUnitCode() == null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Reservation must have an assigned Unit before first-rent payment");
            }
            Unit unit = unitRepository.findById(reservation.getUnitCode())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Assigned Unit not found"));
            assertAmount(data.get("amount"), unit.getPricePerMonth());
            boolean alreadyPaid = paymentRepository.findByReservationId(reservationId).stream()
                    .anyMatch(existing -> "RENT".equalsIgnoreCase(existing.getInvoiceType())
                            && "PAID".equalsIgnoreCase(existing.getStatus()));
            if (alreadyPaid) throw new ResponseStatusException(HttpStatus.CONFLICT, "First month rent is already paid");
            payment = new Payment();
            payment.setId("TXN-" + UUID.randomUUID());
            payment.setReservationId(reservationId);
            payment.setCustomerName(customer.getName());
            payment.setInvoiceType("RENT");
            payment.setAmount(unit.getPricePerMonth());
        } else if ("RENEW".equals(invoiceType)) {
            if (contractRepository == null || policyAnalyticsService == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Renewal service is not configured");
            }
            String contractId = requiredText(data.get("contractId"), "contractId is required");
            Contract contract = contractRepository.findByIdForUpdate(contractId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
            if (!customer.getId().equals(contract.getUserId())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found");
            }
            if (!Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(contract.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Contract cannot be renewed in its current state");
            }
            int months = integerValue(data.getOrDefault("durationMonths", 1), "durationMonths");
            if (months < 1 || months > 36) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "durationMonths must be between 1 and 36");
            }
            BigDecimal monthly = contract.getMonthlyFee() == null ? BigDecimal.ZERO : contract.getMonthlyFee();
            BigDecimal gross = monthly.multiply(BigDecimal.valueOf(months));
            BigDecimal discount = gross.multiply(policyAnalyticsService.getDiscountRate(months));
            BigDecimal overdueFee = overdueFee(contract);
            BigDecimal required = gross.subtract(discount).add(overdueFee).max(BigDecimal.ZERO);
            assertAmount(data.get("amount"), required);

            payment = paymentRepository.findByContractIdAndInvoiceTypeAndStatus(contractId, "RENEW", "PENDING")
                    .orElseGet(() -> {
                        Payment created = new Payment();
                        created.setId("TXN-" + UUID.randomUUID());
                        created.setContractId(contractId);
                        created.setCustomerName(customer.getName());
                        created.setInvoiceType("RENEW");
                        return created;
                    });
            payment.setAmount(required);
            LocalDate oldEnd = contract.getEndDate() == null ? LocalDate.now() : contract.getEndDate();
            LocalDate renewalStart = oldEnd.isBefore(LocalDate.now()) ? LocalDate.now() : oldEnd;
            contract.setEndDate(renewalStart.plusMonths(months));
            contract.setStatus("ACTIVE");
            contract.setLastRenewalAt(LocalDateTime.now());
            if (contract.getPinCode() == null || "000000".equals(contract.getPinCode())) {
                contract.setPinCode(String.format("%06d", new Random().nextInt(1_000_000)));
                unitRepository.findById(contract.getUnitCode()).ifPresent(unit -> {
                    unit.setPinCode(contract.getPinCode());
                    unit.setStatus("occupied");
                    unitRepository.save(unit);
                });
            }
            contractRepository.save(contract);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment type");
        }

        payment.setCustomerName(customer.getName());
        payment.setPaymentMethod(Objects.toString(data.getOrDefault("paymentMethod", "VietQR Napas247")));
        payment.setTransactionCode("TXN-" + UUID.randomUUID());
        payment.setTimeStr(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy")));
        payment.setStatus("PAID");
        payment.setCreatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    public List<Payment> getReservationPayments(String username, String reservationId) {
        User user = requireUser(username);
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
        if ("CUSTOMER".equals(user.getRole()) && !user.getId().equals(reservation.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        if (Set.of("FMANAGER", "FACILITY_MANAGER").contains(user.getRole())
                && !Objects.equals(user.getFacilityCode(), reservation.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        return paymentRepository.findByReservationId(reservationId);
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private static void assertAmount(Object requested, BigDecimal required) {
        if (requested == null) return;
        try {
            if (new BigDecimal(requested.toString()).compareTo(required) != 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment amount does not match invoice");
            }
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment amount");
        }
    }

    private static String requiredText(Object value, String message) {
        if (value == null || value.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.toString().trim();
    }

    private BigDecimal overdueFee(Contract contract) {
        if (!"OVERDUE".equals(contract.getStatus()) || contract.getEndDate() == null) return BigDecimal.ZERO;
        long overdueDays = Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(
                contract.getEndDate() == null ? LocalDate.now() : contract.getEndDate(), LocalDate.now()));
        return policyAnalyticsService.getExtraFee("overduePenaltyPerDay")
                .multiply(BigDecimal.valueOf(overdueDays));
    }

    private static int integerValue(Object value, String field) {
        try { return Integer.parseInt(value.toString()); }
        catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be an integer");
        }
    }
}
