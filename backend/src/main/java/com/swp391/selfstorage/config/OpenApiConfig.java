package com.swp391.selfstorage.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.BooleanSchema;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MapSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.properties.SwaggerUiConfigParameters;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiOAuthProperties;
import org.springdoc.core.providers.ObjectMapperProvider;
import org.springdoc.webmvc.ui.SwaggerIndexPageTransformer;
import org.springdoc.webmvc.ui.SwaggerIndexTransformer;
import org.springdoc.webmvc.ui.SwaggerWelcomeCommon;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.resource.ResourceTransformerChain;
import org.springframework.web.servlet.resource.TransformedResource;

@Configuration
public class OpenApiConfig {

  private static final String BEARER_AUTH = "bearerAuth";

  @Bean
  public OpenAPI storageRentalOpenApi() {
    return new OpenAPI()
      .info(
        new Info()
          .title("Storage Rental API")
          .version("2.0.0")
          .description(
            "RESTful API for Self-Storage Facility Rental & Management System. "
              + "Use POST /api/auth/login to obtain a JWT token, then click Authorize and paste the token."
          )
      )
      .servers(
        List.of(
          new Server()
            .url("http://localhost:8080")
            .description("Local backend")
        )
      )
      .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
      .components(
        new Components()
          .addSecuritySchemes(
            BEARER_AUTH,
            new SecurityScheme()
              .name(BEARER_AUTH)
              .type(SecurityScheme.Type.HTTP)
              .scheme("bearer")
              .bearerFormat("JWT")
          )
      );
  }

  @Bean
  public OpenApiCustomizer validationErrorResponseCustomizer() {
    return openApi -> {
      Components components = openApi.getComponents();
      if (components == null) {
        components = new Components();
        openApi.setComponents(components);
      }

      Schema<?> validationSchema = new ObjectSchema()
        .addProperty("success", new BooleanSchema().example(false))
        .addProperty(
          "message",
          new StringSchema()
            .example(
              "Dữ liệu đầu vào không hợp lệ: facilityCode (Mã cơ sở không được để trống)"
            )
        )
        .addProperty(
          "errors",
          new MapSchema()
            .additionalProperties(new StringSchema())
            .example(Map.of("facilityCode", "Mã cơ sở không được để trống"))
        );

      components.addSchemas("ValidationErrorResponse", validationSchema);

      if (openApi.getPaths() == null) {
        return;
      }

      MediaType badRequestMedia = new MediaType()
        .schema(
          new Schema<>().$ref("#/components/schemas/ValidationErrorResponse")
        )
        .example(
          Map.of(
            "success",
            false,
            "message",
            "Dữ liệu đầu vào không hợp lệ: facilityCode (Mã cơ sở (facilityCode) không được để trống)",
            "errors",
            Map.of(
              "facilityCode",
              "Mã cơ sở (facilityCode) không được để trống"
            )
          )
        );

      ApiResponse badRequestResponse = new ApiResponse()
        .description("Dữ liệu đầu vào / validation không hợp lệ")
        .content(
          new Content().addMediaType("application/json", badRequestMedia)
        );

      openApi
        .getPaths()
        .values()
        .forEach(pathItem ->
          pathItem
            .readOperations()
            .forEach(operation -> {
              ApiResponses responses = operation.getResponses();
              if (responses == null) {
                responses = new ApiResponses();
                operation.setResponses(responses);
              }
              responses.putIfAbsent("400", badRequestResponse);
            })
        );
    };
  }

  @Bean
  public SwaggerIndexTransformer swaggerIndexTransformer(
    SwaggerUiConfigProperties swaggerUiConfig,
    SwaggerUiOAuthProperties swaggerUiOAuthProperties,
    SwaggerUiConfigParameters swaggerUiConfigParameters,
    SwaggerWelcomeCommon swaggerWelcomeCommon,
    ObjectMapperProvider objectMapperProvider
  ) {
    return new SwaggerIndexPageTransformer(
      swaggerUiConfig,
      swaggerUiOAuthProperties,
      swaggerUiConfigParameters,
      swaggerWelcomeCommon,
      objectMapperProvider
    ) {
      @Override
      public Resource transform(
        HttpServletRequest request,
        Resource resource,
        ResourceTransformerChain transformerChain
      ) throws IOException {
        Resource transformed = super.transform(
          request,
          resource,
          transformerChain
        );
        String filename = transformed.getFilename();
        if (filename != null && filename.endsWith("index.html")) {
          String html = new String(
            transformed.getInputStream().readAllBytes(),
            StandardCharsets.UTF_8
          );
          if (!html.contains("/swagger-dark.css")) {
            html = html.replace(
              "</head>",
              "    <link rel=\"stylesheet\" type=\"text/css\" href=\"/swagger-dark.css\" />\n  </head>"
            );
            return new TransformedResource(
              transformed,
              html.getBytes(StandardCharsets.UTF_8)
            );
          }
        }
        return transformed;
      }
    };
  }
}
