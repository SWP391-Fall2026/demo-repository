package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByCccd(String cccd);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findByFacilityCodeAndRoleAndStatus(String facilityCode, String role, String status);
    Optional<User> findByNameAndFacilityCodeAndRole(String name, String facilityCode, String role);
}
