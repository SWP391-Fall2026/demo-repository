package com.swp391.selfstorage.modules.rental.event;

import java.time.LocalDateTime;

public record CheckinVerifiedEvent(String email, String customerName, String reservationId,
    String facilityName, String unitCode, LocalDateTime verifiedAt) {}
