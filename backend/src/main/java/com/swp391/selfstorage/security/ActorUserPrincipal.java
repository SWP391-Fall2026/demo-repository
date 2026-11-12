package com.swp391.selfstorage.security;

import com.swp391.selfstorage.modules.identity.entity.User;
import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;

/** UserDetails carrier preserving the loaded domain user to prevent duplicate per-request DB reads. */
public class ActorUserPrincipal extends org.springframework.security.core.userdetails.User {

  private final transient User domainUser;

  public ActorUserPrincipal(
    User domainUser,
    boolean enabled,
    Collection<? extends GrantedAuthority> authorities
  ) {
    super(
      domainUser.getUsername(),
      domainUser.getPassword(),
      enabled,
      true,
      true,
      true,
      authorities
    );
    this.domainUser = domainUser;
  }

  public User getDomainUser() {
    return domainUser;
  }
}

