package com.swp391.selfstorage.modules.identity.dto;

/** Registration does not create a login session or return a JWT. */
public record RegistrationResult(boolean registered, String email) {}
