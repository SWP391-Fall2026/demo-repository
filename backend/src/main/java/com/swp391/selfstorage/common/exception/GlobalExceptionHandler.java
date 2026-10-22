package com.swp391.selfstorage.common.exception;

import com.swp391.selfstorage.common.web.ApiResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<?> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode()).body(
      ApiResponse.error(e.getReason())
    );
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<?> invalid(IllegalArgumentException e) {
    return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<?> integrity(DataIntegrityViolationException e) {
    return ResponseEntity.status(409).body(
      ApiResponse.error("Dữ liệu xung đột hoặc chưa đáp ứng ràng buộc")
    );
  }

  @ExceptionHandler({
    org.springframework.web.bind.MethodArgumentNotValidException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
  })
  public ResponseEntity<?> validation(Exception e) {
    return ResponseEntity.badRequest().body(
      ApiResponse.error("Dữ liệu đầu vào thiếu hoặc sai định dạng")
    );
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> error(Exception e, HttpServletRequest request) {
    log.error("Unhandled API failure: {} {} ({})", request.getMethod(), request.getRequestURI(), e.toString(), e);
    return ResponseEntity.status(500).body(
      ApiResponse.error("Không thể xử lý yêu cầu. Kiểm tra log máy chủ.")
    );
  }
}
