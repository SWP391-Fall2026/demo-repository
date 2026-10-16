package com.swp391.selfstorage.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.swp391.selfstorage.dto.RegisterRequest;
import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.ContractRepository;
import com.swp391.selfstorage.repository.LoginHistoryRepository;
import com.swp391.selfstorage.repository.PaymentRepository;
import com.swp391.selfstorage.repository.ReservationRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import com.swp391.selfstorage.repository.UserRepository;
import com.swp391.selfstorage.security.JwtUtil;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class FlowRequirementTest {
    @Test
    void exactDepositPaymentMovesReservationToReserved() {
        PaymentRepository payments = mock(PaymentRepository.class);
        ReservationRepository reservations = mock(ReservationRepository.class);
        UnitRepository units = mock(UnitRepository.class);
        UserRepository users = mock(UserRepository.class);
        User customer = user("USR-1", "customer", "CUSTOMER", "HN-CG");
        Reservation reservation = reservation("RSV-1", customer.getId(), "HN-CG", "PENDING_PAYMENT");
        Payment invoice = new Payment();
        invoice.setId("INV-1");
        invoice.setReservationId(reservation.getId());
        invoice.setInvoiceType("DEPOSIT");
        invoice.setAmount(BigDecimal.valueOf(1450000));
        invoice.setStatus("PENDING");

        when(users.findByUsername("customer")).thenReturn(Optional.of(customer));
        when(reservations.findByIdForUpdate("RSV-1")).thenReturn(Optional.of(reservation));
        when(payments.findByReservationIdAndInvoiceTypeAndStatus("RSV-1", "DEPOSIT", "PENDING"))
                .thenReturn(Optional.of(invoice));
        when(payments.save(any(Payment.class))).thenAnswer(call -> call.getArgument(0));

        Payment paid = new PaymentService(payments, reservations, units, users)
                .simulatePayment("customer", Map.of("reservationId", "RSV-1", "amount", 1450000), "DEPOSIT");

        assertEquals("PAID", paid.getStatus());
        assertEquals("RESERVED", reservation.getStatus());
        verify(reservations).save(reservation);
    }

    @Test
    void incorrectDepositAmountDoesNotChangeReservation() {
        PaymentRepository payments = mock(PaymentRepository.class);
        ReservationRepository reservations = mock(ReservationRepository.class);
        UnitRepository units = mock(UnitRepository.class);
        UserRepository users = mock(UserRepository.class);
        User customer = user("USR-1", "customer", "CUSTOMER", "HN-CG");
        Reservation reservation = reservation("RSV-1", customer.getId(), "HN-CG", "PENDING_PAYMENT");
        Payment invoice = new Payment();
        invoice.setId("INV-1");
        invoice.setReservationId(reservation.getId());
        invoice.setInvoiceType("DEPOSIT");
        invoice.setAmount(BigDecimal.valueOf(1450000));
        invoice.setStatus("PENDING");

        when(users.findByUsername("customer")).thenReturn(Optional.of(customer));
        when(reservations.findByIdForUpdate("RSV-1")).thenReturn(Optional.of(reservation));
        when(payments.findByReservationIdAndInvoiceTypeAndStatus("RSV-1", "DEPOSIT", "PENDING"))
                .thenReturn(Optional.of(invoice));

        PaymentService service = new PaymentService(payments, reservations, units, users);
        assertThrows(ResponseStatusException.class, () -> service.simulatePayment(
                "customer", Map.of("reservationId", "RSV-1", "amount", 1), "DEPOSIT"));

        assertEquals("PENDING_PAYMENT", reservation.getStatus());
        verify(reservations, never()).save(any(Reservation.class));
        verify(payments, never()).save(any(Payment.class));
    }

    @Test
    void managerCannotAssignUnitFromAnotherFacility() {
        ReservationRepository reservations = mock(ReservationRepository.class);
        UnitRepository units = mock(UnitRepository.class);
        UserRepository users = mock(UserRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        ContractRepository contracts = mock(ContractRepository.class);
        PolicyAnalyticsService policies = mock(PolicyAnalyticsService.class);
        TaskIncidentService tasks = mock(TaskIncidentService.class);
        User manager = user("MGR-1", "manager", "FMANAGER", "HN-CG");
        Reservation reservation = reservation("RSV-1", "CUST-1", "HN-CG", "RESERVED");
        reservation.setUnitType("M");
        Payment deposit = new Payment();
        deposit.setId("INV-1");
        deposit.setReservationId("RSV-1");
        deposit.setInvoiceType("DEPOSIT");
        deposit.setStatus("PAID");
        Unit unit = new Unit();
        unit.setCode("Q7-101");
        unit.setFacilityCode("HCM-Q7");
        unit.setType("M");
        unit.setStatus("available");

        when(users.findByUsername("manager")).thenReturn(Optional.of(manager));
        when(reservations.findByIdForUpdate("RSV-1")).thenReturn(Optional.of(reservation));
        when(payments.findByReservationIdAndInvoiceTypeAndStatus("RSV-1", "DEPOSIT", "PAID"))
            .thenReturn(Optional.of(deposit));
        when(units.findByIdForUpdate("Q7-101")).thenReturn(Optional.of(unit));

        ReservationService service = new ReservationService(
                reservations, units, users, mock(com.swp391.selfstorage.repository.FacilityRepository.class),
                payments, policies, tasks);
        assertThrows(ResponseStatusException.class, () -> service.assignUnit("manager", "RSV-1", "Q7-101"));

        verify(units, never()).save(any(Unit.class));
    }

    @Test
    void registrationRequiresConfirmPasswordAndCccdGenderYearMatch() {
        UserRepository users = mock(UserRepository.class);
        AuthService service = new AuthService(users, mock(LoginHistoryRepository.class), mock(JwtUtil.class),
                mock(PasswordEncoder.class));
        when(users.existsByUsername(any())).thenReturn(false);
        when(users.existsByEmail(any())).thenReturn(false);

        RegisterRequest missingConfirmation = validRegistration();
        missingConfirmation.setConfirmPassword(null);
        assertThrows(IllegalArgumentException.class, () -> service.validateRegistrationData(missingConfirmation));

        RegisterRequest mismatchedCccd = validRegistration();
        mismatchedCccd.setCccd("001300000001");
        assertThrows(IllegalArgumentException.class, () -> service.validateRegistrationData(mismatchedCccd));
    }

    @Test
    void renewalPaymentExtendsContractAndRestoresActiveAccess() {
        PaymentRepository payments = mock(PaymentRepository.class);
        ReservationRepository reservations = mock(ReservationRepository.class);
        UnitRepository units = mock(UnitRepository.class);
        UserRepository users = mock(UserRepository.class);
        ContractRepository contracts = mock(ContractRepository.class);
        PolicyAnalyticsService policies = mock(PolicyAnalyticsService.class);
        User customer = user("USR-1", "customer", "CUSTOMER", "HN-CG");
        Contract contract = new Contract();
        contract.setId("CTR-1");
        contract.setUserId(customer.getId());
        contract.setCustomerName(customer.getName());
        contract.setUnitCode("A-101");
        contract.setFacilityCode("HN-CG");
        contract.setMonthlyFee(BigDecimal.valueOf(100));
        contract.setEndDate(java.time.LocalDate.now().plusDays(1));
        contract.setStatus("ACTIVE");
        contract.setPinCode("123456");
        Unit unit = new Unit();
        unit.setCode("A-101");
        unit.setFacilityCode("HN-CG");
        unit.setStatus("occupied");

        when(users.findByUsername("customer")).thenReturn(Optional.of(customer));
        when(contracts.findByIdForUpdate("CTR-1")).thenReturn(Optional.of(contract));
        when(policies.getDiscountRate(1)).thenReturn(BigDecimal.ZERO);
        when(units.findById("A-101")).thenReturn(Optional.of(unit));
        when(contracts.save(any(Contract.class))).thenAnswer(call -> call.getArgument(0));
        when(payments.save(any(Payment.class))).thenAnswer(call -> call.getArgument(0));

        Payment payment = new PaymentService(payments, reservations, units, users, contracts, policies)
                .simulatePayment("customer", Map.of(
                        "contractId", "CTR-1", "durationMonths", 1, "amount", 100), "RENEW");

        assertEquals("RENEW", payment.getInvoiceType());
        assertEquals("ACTIVE", contract.getStatus());
        assertEquals("CTR-1", payment.getContractId());
        verify(contracts).save(contract);
    }

    private static User user(String id, String username, String role, String facilityCode) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setName(username);
        user.setRole(role);
        user.setFacilityCode(facilityCode);
        user.setStatus("ACTIVE");
        return user;
    }

    private static Reservation reservation(String id, String userId, String facilityCode, String status) {
        Reservation reservation = new Reservation();
        reservation.setId(id);
        reservation.setUserId(userId);
        reservation.setFacilityCode(facilityCode);
        reservation.setStatus(status);
        return reservation;
    }

    private static RegisterRequest validRegistration() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van A");
        request.setDob("2000-01-01");
        request.setGender("Nam");
        request.setPhone("0912345678");
        request.setEmail("nguyenvana@example.vn");
        request.setCccd("001200000001");
        request.setUsername("nguyenvana");
        request.setPassword("secret123");
        request.setConfirmPassword("secret123");
        return request;
    }
}
