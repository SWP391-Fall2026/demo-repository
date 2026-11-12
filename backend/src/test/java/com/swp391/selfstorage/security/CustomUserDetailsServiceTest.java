package com.swp391.selfstorage.security;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomUserDetailsServiceTest {
  @Test
  void authenticatesStoredMixedCaseUsernameAfterCaseInsensitiveLogin() {
    UserRepository users=mock(UserRepository.class);
    User legacy=new User();
    legacy.setUsername("Legacy_User");legacy.setPassword("unit-fixture-only");
    legacy.setRole("CUSTOMER");legacy.setStatus("ACTIVE");
    when(users.findByUsernameIgnoreCaseOrEmailIgnoreCase("legacy_user","legacy_user"))
        .thenReturn(Optional.of(legacy));

    var details=new CustomUserDetailsService(users).loadUserByUsername("Legacy_User");

    assertEquals("Legacy_User",details.getUsername());
    assertTrue(details.isEnabled());
    assertTrue(details.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_CUSTOMER")));
    assertInstanceOf(ActorUserPrincipal.class, details);
    assertSame(legacy, ((ActorUserPrincipal) details).getDomainUser());
  }

  @Test
  void actorContextResolvesActorUserPrincipalWithoutSecondUserQuery() {
    UserRepository users=mock(UserRepository.class);
    User domainUser=new User();
    domainUser.setId("USR-01");
    domainUser.setUsername("customer");
    domainUser.setPassword("unit-fixture-only");
    domainUser.setRole("CUSTOMER");
    domainUser.setStatus("ACTIVE");
    when(users.findByUsernameIgnoreCaseOrEmailIgnoreCase("customer","customer"))
        .thenReturn(Optional.of(domainUser));

    var details=new CustomUserDetailsService(users).loadUserByUsername("customer");
    clearInvocations(users);

    try {
      SecurityContextHolder.getContext().setAuthentication(
          new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities())
      );
      User resolved=new ActorContext(users).current();
      assertSame(domainUser, resolved);
      verifyNoInteractions(users);
    } finally {
      SecurityContextHolder.clearContext();
    }
  }
}
