package com.swp391.selfstorage.modules.identity.service;

import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

/** Separate proxied transaction: OTP consumption only completes after commit. */
@Service
public class RegistrationAccountService {
  private final UserRepository users;
  private final FacilityRepository facilities;
  private final boolean schemaReviewed;

  public RegistrationAccountService(UserRepository users, FacilityRepository facilities,
      @Value("${app.auth.schema-reviewed:false}") boolean schemaReviewed) {
    this.users = users;
    this.facilities = facilities;
    this.schemaReviewed = schemaReviewed;
  }

  public Facility requireActiveFacility(String code) {
    if (!schemaReviewed) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
          "Chưa xác minh schema và ràng buộc đăng ký trên database được phê duyệt");
    }
    if (code == null || code.isBlank()) return null;
    Facility facility = facilities.findById(code.trim()).orElseThrow(
        () -> new IllegalArgumentException("Cơ sở đã chọn không tồn tại"));
    if (!"ACTIVE".equalsIgnoreCase(facility.getStatus())) {
      throw new IllegalArgumentException("Cơ sở đã chọn hiện không hoạt động");
    }
    return facility;
  }

  public void requireAvailable(String username, String email, String phone) {
    if (!schemaReviewed) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
          "Chưa xác minh schema và ràng buộc đăng ký trên database được phê duyệt");
    }
    if (users.existsByUsernameIgnoreCase(username)) {
      throw new IllegalArgumentException("Tên đăng nhập đã được sử dụng");
    }
    if (users.existsByEmailIgnoreCase(email)) {
      throw new IllegalArgumentException("Email đã được sử dụng");
    }
    if (users.existsByNormalizedPhone(phone)) {
      throw new IllegalArgumentException("Số điện thoại đã được sử dụng");
    }
  }

  @Transactional
  public User create(User candidate) {
    requireAvailable(candidate.getUsername(), candidate.getEmail(), candidate.getPhone());
    Facility facility = requireActiveFacility(candidate.getFacilityCode());
    candidate.setFacilityCode(facility == null ? null : facility.getCode());
    candidate.setFacility(facility == null ? null : facility.getName());
    // PostgreSQL UNIQUE constraints remain necessary for multiple app instances.
    // No DDL, implicit backfill or Hibernate schema update is performed here.
    return users.saveAndFlush(candidate);
  }
}
