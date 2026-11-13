package com.swp391.selfstorage.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class UploadWebConfig implements WebMvcConfigurer {

  private final String uploadDir;

  public UploadWebConfig(@Value("${app.upload-dir}") String uploadDir) {
    this.uploadDir = uploadDir;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path p = Path.of(uploadDir).toAbsolutePath().normalize();
    try {
      Files.createDirectories(p);
    } catch (IOException ignored) {}

    String location = p.toUri().toString();
    if (!location.endsWith("/")) {
      location += "/";
    }

    registry.addResourceHandler("/api/files/**")
        .addResourceLocations(location);
  }
}
