package com.swp391.selfstorage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class SelfStorageApplication {

  public static void main(String[] args) {
    SpringApplication.run(SelfStorageApplication.class, args);
  }
}
