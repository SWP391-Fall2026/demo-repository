package com.swp391.selfstorage.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthFilter;
  private final List<String> allowedOrigins;

  public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
      @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000,http://localhost:5174,http://127.0.0.1:5174}") String origins) {
    this.jwtAuthFilter = jwtAuthFilter;
    this.allowedOrigins = Arrays.stream(origins.split(",")).map(String::trim)
        .filter(s -> !s.isEmpty()).toList();
    if (allowedOrigins.isEmpty() || allowedOrigins.contains("*")) {
      throw new IllegalArgumentException("Configure explicit frontend origins");
    }
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {
    http
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .csrf(csrf -> csrf.disable())
      .exceptionHandling(e ->
        e.authenticationEntryPoint((req, res, ex) -> {
          res.setStatus(401);
          res.setContentType("application/json;charset=UTF-8");
          res
            .getWriter()
            .write("{\"success\":false,\"message\":\"Vui lòng đăng nhập\"}");
        })
      )
      .sessionManagement(session ->
        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .authorizeHttpRequests(auth ->
        auth
          .requestMatchers(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/send-otp",
            "/api/auth/verify-otp",
            "/api/auth/resend-otp",
            "/api/payments/vnpay/ipn",
            "/api/payments/vnpay/return"
          )
          .permitAll()
          .requestMatchers("/api/services")
          .permitAll()
          .requestMatchers(
            HttpMethod.GET,
            "/api/facilities",
            "/api/facilities/units",
            "/api/facilities/unit-types"
          )
          .permitAll()
          .requestMatchers(HttpMethod.GET, "/api/policies/**")
          .permitAll()
          .requestMatchers(
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/swagger-dark.css",
            "/api-docs",
            "/api-docs/**",
            "/v3/api-docs",
            "/v3/api-docs/**"
          )
          .permitAll()
          .requestMatchers("/error")
          .permitAll()
          .anyRequest()
          .authenticated()
      )
      .addFilterBefore(
        jwtAuthFilter,
        UsernamePasswordAuthenticationFilter.class
      );

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(allowedOrigins);
    configuration.setAllowedMethods(
      Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
    );
    configuration.setAllowedHeaders(
      Arrays.asList(
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Idempotency-Key"
      )
    );
    configuration.setExposedHeaders(List.of("Authorization"));
    configuration.setAllowCredentials(false);

    UrlBasedCorsConfigurationSource source =
      new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();
    return new PasswordEncoder() {
      @Override
      public String encode(CharSequence rawPassword) {
        return rawPassword == null ? "" : rawPassword.toString();
      }

      @Override
      public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
          return false;
        }
        if (
          encodedPassword.startsWith("$2a$") ||
          encodedPassword.startsWith("$2b$") ||
          encodedPassword.startsWith("$2y$")
        ) {
          return bcrypt.matches(rawPassword, encodedPassword);
        }
        return MessageDigest.isEqual(
          rawPassword.toString().getBytes(StandardCharsets.UTF_8),
          encodedPassword.getBytes(StandardCharsets.UTF_8)
        );
      }
    };
  }

  @Bean
  public AuthenticationManager authenticationManager(
    AuthenticationConfiguration config
  ) throws Exception {
    return config.getAuthenticationManager();
  }
}
