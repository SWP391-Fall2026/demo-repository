package com.swp391.selfstorage.modules.identity.repository;

import com.swp391.selfstorage.modules.identity.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
  Optional<User> findByUsername(String username);
  Optional<User> findByEmail(String email);
  Optional<User> findByUsernameOrEmail(String username, String email);
  boolean existsByUsername(String username);
  boolean existsByEmail(String email);
}
