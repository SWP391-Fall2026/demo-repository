package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.modules.rental.event.CheckinVerifiedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
public class CheckinNotificationService {
  private static final Logger log = LoggerFactory.getLogger(CheckinNotificationService.class);
  private final ObjectProvider<JavaMailSender> senders;
  private final String from;

  public CheckinNotificationService(ObjectProvider<JavaMailSender> senders,
      @Value("${app.auth.mail-from:}") String from) {
    this.senders = senders;
    this.from = from;
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void checkinVerified(CheckinVerifiedEvent event) {
    JavaMailSender sender = senders.getIfAvailable();
    if (sender == null || from.isBlank() || event.email() == null || event.email().isBlank()) return;
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from); message.setTo(event.email());
    message.setSubject("Kho Gọn - Đã xác nhận check-in");
    message.setText("Xin chào " + event.customerName() + ",\n\n"
        + "Nhân viên đã xác nhận thông tin cho thẻ hẹn " + event.reservationId() + ".\n"
        + "Cơ sở: " + event.facilityName() + "\nKho: " + event.unitCode() + "\n\n"
        + "Đăng nhập để xem hợp đồng, xác nhận điều khoản và thanh toán hóa đơn thuê. PIN chỉ được cấp sau khi thanh toán thành công.");
    try { sender.send(message); }
    catch (RuntimeException error) { log.warn("Check-in notification email could not be sent for reservation {}", event.reservationId()); }
  }

}
