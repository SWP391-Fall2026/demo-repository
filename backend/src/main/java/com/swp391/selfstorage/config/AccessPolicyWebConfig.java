package com.swp391.selfstorage.config;

import com.swp391.selfstorage.modules.identity.service.AccessPolicyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AccessPolicyWebConfig implements WebMvcConfigurer {
  private final AccessPolicyService service;
  public AccessPolicyWebConfig(AccessPolicyService service) { this.service = service; }
  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(new HandlerInterceptor() {
      @Override
      public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Use canonical controller mapping so URL encoding cannot bypass a restriction.
        Object mapping = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (mapping == null) return true;
        String path = mapping.toString();
        service.check(request.getMethod(), path);
        return true;
      }
    }).addPathPatterns("/api/**");
  }
}
