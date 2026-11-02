package com.swp391.selfstorage;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AccessPolicyIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired UserRepository users;

  @BeforeEach
  void accounts() {
    account("access-admin", "ADMIN");
    account("access-customer", "CUSTOMER");
  }
  private void account(String name, String role) {
    User u = new User();
    u.setId(name); u.setUsername(name); u.setName(name); u.setEmail(name + "@example.test");
    u.setPassword("unused-in-mockmvc"); u.setRole(role); u.setStatus("ACTIVE");
    users.save(u);
  }
  private void change(String permission, boolean enabled) throws Exception {
    mvc.perform(patch("/api/auth/access-policy").with(user("access-admin"))
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"role\":\"CUSTOMER\",\"permission\":\"" + permission + "\",\"enabled\":" + enabled + "}"))
        .andExpect(status().isOk());
  }

  @Test
  void savedReadPermissionBlocksExistingEndpointAndCanBeRestored() throws Exception {
    change("RENTAL.READ", false);
    mvc.perform(get("/api/contracts").with(user("access-customer"))).andExpect(status().isForbidden());
    mvc.perform(get("/api/facilities")).andExpect(status().isOk());
    change("RENTAL.READ", true);
    mvc.perform(get("/api/contracts").with(user("access-customer"))).andExpect(status().isOk());
  }

  @Test
  void ticketAliasCannotBypassDisabledPermission() throws Exception {
    change("SUPPORT.WRITE", false);
    for (String path : new String[]{"/api/tickets", "/api/tasks/tickets"})
      mvc.perform(post(path).with(user("access-customer")).contentType(MediaType.APPLICATION_JSON).content("{}"))
          .andExpect(status().isForbidden());
    mvc.perform(get("/api/tickets").with(user("access-customer"))).andExpect(status().isOk());
  }

  @Test
  void customerCannotManagePolicyAndAdminCannotGrantCrossRoleOrLockAdminManagement() throws Exception {
    mvc.perform(get("/api/auth/access-policy").with(user("access-customer"))).andExpect(status().isForbidden());
    mvc.perform(patch("/api/auth/access-policy").with(user("access-customer"))
        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"CUSTOMER\",\"permission\":\"BILLING.WRITE\",\"enabled\":true}"))
        .andExpect(status().isForbidden());
    for (String body : new String[]{
        "{\"role\":\"CUSTOMER\",\"permission\":\"AUDIT.READ\",\"enabled\":true}",
        "{\"role\":\"ADMIN\",\"permission\":\"IDENTITY.WRITE\",\"enabled\":false}",
        "{\"role\":\"CUSTOMER\",\"permission\":\"BILLING.WRITE\",\"enabled\":\"false\"}"})
      mvc.perform(patch("/api/auth/access-policy").with(user("access-admin"))
          .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
  }

  @Test
  void publicPoliciesDoNotExposeAccessConfiguration() throws Exception {
    change("BILLING.WRITE", false);
    mvc.perform(get("/api/auth/access-policy").with(user("access-admin")))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.CUSTOMER").isArray());
    mvc.perform(get("/api/policies")).andExpect(status().isOk())
        .andExpect(jsonPath("$.data['rbac.CUSTOMER.BILLING.WRITE']").doesNotExist());
  }
}
