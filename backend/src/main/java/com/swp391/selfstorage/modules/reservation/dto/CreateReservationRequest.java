package com.swp391.selfstorage.modules.reservation.dto;

import jakarta.validation.constraints.*;
import java.time.*;

public record CreateReservationRequest(
  @NotBlank String facilityCode,
  @NotBlank String unitType,
  @NotNull LocalDate startDate,
  @NotNull LocalDateTime rentalStartAt,
  @NotNull LocalDateTime appointmentAt,
  @Min(1) @Max(36) int durationMonths
) {}
