package com.swp391.selfstorage.modules.identity.repository;

import com.swp391.selfstorage.modules.identity.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
  Optional<User> findByUsername(String username);
  Optional<User> findByEmail(String email);
  Optional<User> findByUsernameOrEmail(String username, String email);
  boolean existsByUsername(String username);
  boolean existsByEmail(String email);
  Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);
  boolean existsByUsernameIgnoreCase(String username);
  boolean existsByEmailIgnoreCase(String email);
  boolean existsByCccd(String cccd);

  @Query("select (count(u) > 0) from User u where u.facilityCode = :facilityCode and upper(u.role) in ('FMANAGER', 'FACILITY_MANAGER') and (:excludeId is null or u.id <> :excludeId)")
  boolean existsOtherFacilityManager(@Param("facilityCode") String facilityCode, @Param("excludeId") String excludeId);

  @Query("select (count(u) > 0) from User u where upper(u.role) in :roles and (:excludeId is null or u.id <> :excludeId)")
  boolean existsOtherUserWithRole(@Param("roles") java.util.Collection<String> roles, @Param("excludeId") String excludeId);

  @Query("select (count(u) > 0) from User u where replace(replace(replace(u.phone, ' ', ''), '.', ''), '-', '') = :phone")
  boolean existsByNormalizedPhone(@Param("phone") String phone);
}
