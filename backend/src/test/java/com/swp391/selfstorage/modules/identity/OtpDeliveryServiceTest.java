package com.swp391.selfstorage.modules.identity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.modules.identity.service.OtpDeliveryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.server.ResponseStatusException;

class OtpDeliveryServiceTest {
  @Test
  void sendsGeneratedCodeToRequestedAddress() {
    @SuppressWarnings("unchecked")
    ObjectProvider<JavaMailSender> senders = mock(ObjectProvider.class);
    JavaMailSender sender = mock(JavaMailSender.class);
    when(senders.getIfAvailable()).thenReturn(sender);
    OtpDeliveryService service = new OtpDeliveryService(senders, "email", "noreply@example.test");

    service.send("person@example.test", "012345");

    var message = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(sender).send(message.capture());
    assertArrayEquals(new String[] { "person@example.test" }, message.getValue().getTo());
    assertTrue(message.getValue().getText().contains("012345"));
  }

  @Test
  void failsClosedWhenEmailDeliveryIsNotEnabled() {
    @SuppressWarnings("unchecked")
    ObjectProvider<JavaMailSender> senders = mock(ObjectProvider.class);
    OtpDeliveryService service = new OtpDeliveryService(senders, "disabled", "");

    assertEquals(503, assertThrows(ResponseStatusException.class,
        () -> service.send("person@example.test", "012345")).getStatusCode().value());
    verifyNoInteractions(senders);
  }

  @Test
  void failsWhenSmtpRejectsAndFallbackIsDisabled() {
    @SuppressWarnings("unchecked")
    ObjectProvider<JavaMailSender> senders = mock(ObjectProvider.class);
    JavaMailSender sender = mock(JavaMailSender.class);
    when(senders.getIfAvailable()).thenReturn(sender);
    doThrow(new org.springframework.mail.MailSendException("SMTP rejected sender"))
        .when(sender).send(any(SimpleMailMessage.class));
    OtpDeliveryService service = new OtpDeliveryService(senders, "email", "noreply@example.test");

    assertEquals(503, assertThrows(ResponseStatusException.class,
        () -> service.send("person@example.test", "012345")).getStatusCode().value());
  }
}
