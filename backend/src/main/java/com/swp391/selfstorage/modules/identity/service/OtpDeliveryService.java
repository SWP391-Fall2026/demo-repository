package com.swp391.selfstorage.modules.identity.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class OtpDeliveryService {
  private final ObjectProvider<JavaMailSender> senders;
  private final String mode;
  private final String from;
  private final boolean logFallback;

  public OtpDeliveryService(ObjectProvider<JavaMailSender> senders, String mode, String from) {
    this(senders, mode, from, false);
  }

  @Autowired
  public OtpDeliveryService(ObjectProvider<JavaMailSender> senders,
      @Value("${app.auth.otp-delivery:disabled}") String mode,
      @Value("${app.auth.mail-from:}") String from,
      @Value("${app.auth.otp-log-fallback:false}") boolean logFallback) {
    this.senders = senders;
    this.mode = mode;
    this.from = from;
    this.logFallback = logFallback;
  }

  public void send(String email, String code) {
    if (!"email".equals(mode)) {
      throw unavailable("Chưa bật gửi OTP qua email");
    }
    JavaMailSender sender = senders.getIfAvailable();
    if (sender == null || from.isBlank()) {
      throw unavailable("Chưa cấu hình email xác minh");
    }
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(email);
    message.setSubject("Storage Rental - Mã xác minh đăng ký");
    message.setText("Mã xác minh: " + code
        + "\nMã có hiệu lực tối đa 5 phút. Không chia sẻ mã này.");
    try {
      sender.send(message);
    } catch (MailException ex) {
      System.err.println("------------------------------------------------------------------");
      System.err.println("[OTP FALLBACK] Lỗi gửi qua Brevo SMTP: " + ex.getMessage());
      System.err.println("------------------------------------------------------------------");
      if (!logFallback) throw unavailable("Không gửi được mã xác minh qua email. Kiểm tra cấu hình SMTP.");
      System.err.println("[OTP CODE CHO " + email + "]: " + code);
      // Chỉ in mã khi operator chủ động bật fallback cho demo nội bộ.
    }
  }

  private ResponseStatusException unavailable(String message) {
    return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, message);
  }
}
