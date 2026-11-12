package com.swp391.selfstorage.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JwtLogoutRevocationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder passwords;

  @Test
  void logoutRevokesJwtServerSideUntilReauthenticated() throws Exception {
    String username = "logout_verify_user";
    if (users.findByUsername(username).isEmpty()) {
      User u = new User();
      u.setId("USR-LOGOUT-1");
      u.setName("Logout Verification User");
      u.setUsername(username);
      u.setEmail("logout.verify@selfstorage.invalid");
      u.setPhone("0901999888");
      u.setCccd("001099001122");
      u.setPassword(passwords.encode("TestPass123!"));
      u.setRole("CUSTOMER");
      u.setRoleTitle("CUSTOMER");
      u.setStatus("ACTIVE");
      users.saveAndFlush(u);
    }

    String loginBody = json.writeValueAsString(Map.of("username", username, "password", "TestPass123!"));
    String loginResponse = mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(loginBody))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    JsonNode loginNode = json.readTree(loginResponse);
    String token = loginNode.path("token").asText();
    assertFalse(token.isBlank());

    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));

    // Replaying the revoked JWT must be rejected with 401
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
        .andExpect(status().isUnauthorized());

    // A fresh login issues a new valid token
    String reLoginResponse = mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(loginBody))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    String freshToken = json.readTree(reLoginResponse).path("token").asText();
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + freshToken))
        .andExpect(status().isOk());
  }
}

