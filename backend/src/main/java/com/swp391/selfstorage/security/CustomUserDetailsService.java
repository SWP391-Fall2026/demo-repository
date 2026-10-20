package com.swp391.selfstorage.security;

import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import java.util.Collections;
import java.util.Locale;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;

  public CustomUserDetailsService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String usernameOrEmail)
    throws UsernameNotFoundException {
    String clean = usernameOrEmail.trim().toLowerCase(Locale.ROOT);
    User user = userRepository
      .findByUsernameIgnoreCaseOrEmailIgnoreCase(clean, clean)
      .orElseThrow(() ->
        new UsernameNotFoundException(
          "Không tìm thấy người dùng: " + usernameOrEmail
        )
      );

    return new org.springframework.security.core.userdetails.User(
      user.getUsername(),
      user.getPassword(),
      "ACTIVE".equalsIgnoreCase(user.getStatus()),
      true,
      true,
      true,
      Collections.singletonList(
        new SimpleGrantedAuthority(
          "ROLE_" +
            switch (user.getRole()) {
              case "FACILITY_MANAGER" -> "FMANAGER";
              case "OPS_MANAGER" -> "OPS_MGR";
              case "SYSTEM_ADMIN" -> "ADMIN";
              default -> user.getRole();
            }
        )
      )
    );
  }
}
