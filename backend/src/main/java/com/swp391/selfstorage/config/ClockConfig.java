package com.swp391.selfstorage.config;

import java.time.*;
import org.springframework.context.annotation.*;

@Configuration
public class ClockConfig {

  @Bean
  public Clock businessClock() {
    return Clock.system(ZoneId.of("Asia/Ho_Chi_Minh"));
  }
}
