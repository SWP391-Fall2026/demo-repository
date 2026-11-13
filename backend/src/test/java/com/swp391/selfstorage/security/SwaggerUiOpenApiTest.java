package com.swp391.selfstorage.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SwaggerUiOpenApiTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;

  @Test
  void apiDocsAndSwaggerUiArePubliclyAccessibleWithBearerScheme() throws Exception {
    String docsBody = mvc.perform(get("/api-docs"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    JsonNode spec = json.readTree(docsBody);
    assertEquals("3.1.0", spec.path("openapi").asText());
    assertEquals("Storage Rental API", spec.path("info").path("title").asText());
    assertTrue(spec.path("components").path("securitySchemes").has("bearerAuth"));
    assertTrue(spec.path("components").path("schemas").has("ValidationErrorResponse"));
    assertTrue(spec.path("paths").has("/api/auth/login"));
    assertTrue(spec.path("paths").has("/api/facilities"));
    assertTrue(
      spec
        .path("paths")
        .path("/api/reservations")
        .path("post")
        .path("responses")
        .has("400")
    );

    String indexHtml = mvc.perform(get("/swagger-ui/index.html"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    assertTrue(indexHtml.contains("/swagger-dark.css"));

    mvc.perform(get("/swagger-dark.css"))
        .andExpect(status().isOk());

    String initJs = mvc.perform(get("/swagger-ui/swagger-initializer.js"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    assertTrue(initJs.contains("/api-docs"));

    String css = mvc.perform(get("/swagger-ui/swagger-ui.css"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    assertTrue(css.contains("prefers-color-scheme") || css.contains("dark"));
  }

  @Test
  @WithMockUser(username = "customer", roles = "CUSTOMER")
  void validationErrorsReturnClearFieldDetailsForSwaggerTryItOut() throws Exception {
    String invalidBody = """
        {
          "facilityCode": "",
          "unitType": "S",
          "durationMonths": 0
        }
        """;

    String fieldErrorResp = mvc.perform(post("/api/reservations")
            .contentType(MediaType.APPLICATION_JSON)
            .content(invalidBody))
        .andExpect(status().isBadRequest())
        .andReturn()
        .getResponse()
        .getContentAsString();

    JsonNode fieldJson = json.readTree(fieldErrorResp);
    assertFalse(fieldJson.path("success").asBoolean(true));
    assertTrue(fieldJson.path("message").asText().contains("facilityCode"));
    assertTrue(fieldJson.path("errors").has("facilityCode"));
    assertTrue(fieldJson.path("errors").has("durationMonths"));
    assertTrue(fieldJson.path("errors").has("startDate"));

    String badDateBody = """
        {
          "facilityCode": "HN-CG",
          "unitType": "S",
          "startDate": "not-a-date",
          "rentalStartAt": "2026-12-01T08:00:00",
          "appointmentAt": "2026-12-01T08:00:00",
          "durationMonths": 1
        }
        """;

    String formatErrorResp = mvc.perform(post("/api/reservations")
            .contentType(MediaType.APPLICATION_JSON)
            .content(badDateBody))
        .andExpect(status().isBadRequest())
        .andReturn()
        .getResponse()
        .getContentAsString();

    JsonNode formatJson = json.readTree(formatErrorResp);
    assertFalse(formatJson.path("success").asBoolean(true));
    assertTrue(formatJson.path("message").asText().contains("startDate"));
    assertTrue(formatJson.path("errors").has("startDate"));
  }
}

