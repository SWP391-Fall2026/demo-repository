package com.swp391.selfstorage.modules.identity.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OtpChallengeResponse(
    String email, Instant expiresAt, Instant resendAvailableAt, String delivery) {}
