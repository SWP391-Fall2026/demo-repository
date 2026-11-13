package com.swp391.selfstorage.modules.reservation.dto;

import jakarta.validation.constraints.*;
import java.time.*;

public record CreateReservationRequest(
  @NotBlank(message = "Mã cơ sở (facilityCode) không được để trống") String facilityCode,
  @NotBlank(message = "Loại kho (unitType) không được để trống") String unitType,
  @NotNull(message = "Ngày bắt đầu (startDate) không được để trống") LocalDate startDate,
  @NotNull(message = "Thời gian bắt đầu thuê (rentalStartAt) không được để trống") LocalDateTime rentalStartAt,
  @NotNull(message = "Thời gian hẹn check-in (appointmentAt) không được để trống") LocalDateTime appointmentAt,
  @Min(value = 1, message = "Thời hạn thuê tối thiểu là 1 tháng")
  @Max(value = 36, message = "Thời hạn thuê tối đa là 36 tháng")
  int durationMonths
) {}
