package com.swp391.selfstorage.modules.identity.service;

import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Passwords are credentials: validation never changes the supplied string. */
@Component
public class PasswordPolicy {
  private final int maximumBytes;

  public PasswordPolicy(@Value("${app.auth.password-max-bytes:72}") int maximumBytes) {
    if (maximumBytes != 72) {
      throw new IllegalArgumentException("Approved password policy requires a 72-byte UTF-8 maximum");
    }
    this.maximumBytes = maximumBytes;
  }

  public void validateRegistration(String password, String confirmation) {
    if (password == null || password.codePoints().allMatch(c ->
        Character.isWhitespace(c) || Character.isSpaceChar(c))) {
      throw new IllegalArgumentException("Mật khẩu không được để trống hoặc chỉ chứa khoảng trắng");
    }
    if (password.length() < 6) {
      throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
    }
    if (!wellFormedUnicode(password)) {
      throw new IllegalArgumentException("Mật khẩu chứa ký tự Unicode không hợp lệ");
    }
    if (confirmation == null || !password.equals(confirmation)) {
      throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
    }
    if (password.getBytes(StandardCharsets.UTF_8).length > maximumBytes) {
      throw new IllegalArgumentException("Mật khẩu vượt giới hạn " + maximumBytes + " byte UTF-8");
    }
  }

  public boolean canAuthenticate(String password) {
    return password != null && !password.isBlank()
        && wellFormedUnicode(password)
        && password.getBytes(StandardCharsets.UTF_8).length <= 72;
  }

  private boolean wellFormedUnicode(String password) {
    // Unpaired surrogates would be replaced by the UTF-8 encoder, changing credentials.
    return password.codePoints().noneMatch(c -> c >= 0xD800 && c <= 0xDFFF);
  }
}
