package com.swp391.selfstorage.common.web;

import java.math.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class Inputs {

  private Inputs() {}

  public static String text(Map<String, ?> d, String k) {
    Object v = d.get(k);
    if (v == null || v.toString().isBlank()) throw bad(k + " is required");
    return v.toString().trim();
  }

  public static String optional(Map<String, ?> d, String k) {
    return Objects.toString(d.get(k), "").trim();
  }

  public static BigDecimal money(Object v) {
    try {
      BigDecimal b = new BigDecimal(v.toString());
      if (b.signum() < 0) throw bad("Amount must not be negative");
      return b;
    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      throw bad("Invalid amount");
    }
  }

  public static ResponseStatusException bad(String message) {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
  }

  public static ResponseStatusException conflict(String m) {
    return new ResponseStatusException(HttpStatus.CONFLICT, m);
  }

  public static ResponseStatusException missing() {
    return new ResponseStatusException(
      HttpStatus.NOT_FOUND,
      "Không tìm thấy dữ liệu trong phạm vi được cấp quyền"
    );
  }
}
