package com.swp391.selfstorage.common.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import com.swp391.selfstorage.common.web.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingPathVariableException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(
    GlobalExceptionHandler.class
  );

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiResponse<?>> status(ResponseStatusException e) {
    String reason = e.getReason() != null && !e.getReason().isBlank()
      ? e.getReason()
      : "Yêu cầu không hợp lệ";
    return ResponseEntity.status(e.getStatusCode()).body(
      ApiResponse.error(reason)
    );
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiResponse<?>> invalid(IllegalArgumentException e) {
    String msg = e.getMessage() != null && !e.getMessage().isBlank()
      ? e.getMessage()
      : "Tham số đầu vào không hợp lệ";
    return ResponseEntity.badRequest().body(ApiResponse.error(msg));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiResponse<?>> integrity(
    DataIntegrityViolationException e
  ) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(
      ApiResponse.error("Dữ liệu xung đột hoặc chưa đáp ứng ràng buộc")
    );
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<?>> methodArgumentNotValid(
    MethodArgumentNotValidException e
  ) {
    Map<String, String> errors = new LinkedHashMap<>();
    for (FieldError fe : e.getBindingResult().getFieldErrors()) {
      String msg = Objects.requireNonNullElse(
        fe.getDefaultMessage(),
        "Giá trị không hợp lệ"
      );
      errors.merge(fe.getField(), msg, (a, b) -> a + "; " + b);
    }
    for (ObjectError oe : e.getBindingResult().getGlobalErrors()) {
      String msg = Objects.requireNonNullElse(
        oe.getDefaultMessage(),
        "Dữ liệu không hợp lệ"
      );
      errors.merge(oe.getObjectName(), msg, (a, b) -> a + "; " + b);
    }
    return buildValidationResponse(errors);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiResponse<?>> constraintViolation(
    ConstraintViolationException e
  ) {
    Map<String, String> errors = new LinkedHashMap<>();
    for (ConstraintViolation<?> violation : e.getConstraintViolations()) {
      String path = violation.getPropertyPath().toString();
      int dot = path.lastIndexOf('.');
      String field = dot >= 0 && dot + 1 < path.length()
        ? path.substring(dot + 1)
        : path;
      String msg = Objects.requireNonNullElse(
        violation.getMessage(),
        "Giá trị không hợp lệ"
      );
      errors.merge(field, msg, (a, b) -> a + "; " + b);
    }
    return buildValidationResponse(errors);
  }

  @ExceptionHandler(HandlerMethodValidationException.class)
  public ResponseEntity<ApiResponse<?>> handlerMethodValidation(
    HandlerMethodValidationException e
  ) {
    Map<String, String> errors = new LinkedHashMap<>();
    for (ParameterValidationResult result : e.getAllValidationResults()) {
      String paramName = Objects.requireNonNullElse(
        result.getMethodParameter().getParameterName(),
        "parameter"
      );
      String detail = result
        .getResolvableErrors()
        .stream()
        .map(MessageSourceResolvable::getDefaultMessage)
        .filter(Objects::nonNull)
        .collect(Collectors.joining("; "));
      errors.merge(
        paramName,
        detail.isBlank() ? "Giá trị không hợp lệ" : detail,
        (a, b) -> a + "; " + b
      );
    }
    return buildValidationResponse(errors);
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ApiResponse<?>> typeMismatch(
    MethodArgumentTypeMismatchException e
  ) {
    String field = e.getName();
    String expected = e.getRequiredType() != null
      ? e.getRequiredType().getSimpleName()
      : "hợp lệ";
    String reason = "Giá trị không đúng định dạng kiểu " + expected;
    return ResponseEntity.badRequest().body(
      ApiResponse.validationError(
        "Tham số '" + field + "' không đúng định dạng (yêu cầu kiểu " + expected + ")",
        Map.of(field, reason)
      )
    );
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ApiResponse<?>> missingParam(
    MissingServletRequestParameterException e
  ) {
    String field = e.getParameterName();
    String reason = "Thiếu tham số bắt buộc (kiểu " + e.getParameterType() + ")";
    return ResponseEntity.badRequest().body(
      ApiResponse.validationError(
        "Thiếu tham số bắt buộc '" + field + "'",
        Map.of(field, reason)
      )
    );
  }

  @ExceptionHandler(MissingServletRequestPartException.class)
  public ResponseEntity<ApiResponse<?>> missingPart(
    MissingServletRequestPartException e
  ) {
    String part = e.getRequestPartName();
    return ResponseEntity.badRequest().body(
      ApiResponse.validationError(
        "Thiếu dữ liệu multipart bắt buộc '" + part + "'",
        Map.of(part, "Trường/tệp bắt buộc đang bị thiếu")
      )
    );
  }

  @ExceptionHandler(MissingRequestHeaderException.class)
  public ResponseEntity<ApiResponse<?>> missingHeader(
    MissingRequestHeaderException e
  ) {
    String header = e.getHeaderName();
    return ResponseEntity.badRequest().body(
      ApiResponse.validationError(
        "Thiếu header bắt buộc '" + header + "'",
        Map.of(header, "Header bắt buộc đang bị thiếu")
      )
    );
  }

  @ExceptionHandler(MissingPathVariableException.class)
  public ResponseEntity<ApiResponse<?>> missingPathVar(
    MissingPathVariableException e
  ) {
    String variable = e.getVariableName();
    return ResponseEntity.badRequest().body(
      ApiResponse.validationError(
        "Thiếu biến đường dẫn '" + variable + "'",
        Map.of(variable, "Biến đường dẫn bắt buộc đang bị thiếu")
      )
    );
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiResponse<?>> notReadable(
    HttpMessageNotReadableException e
  ) {
    Throwable cause = e.getCause();
    while (cause != null && !(cause instanceof MismatchedInputException)) {
      cause = cause.getCause();
    }
    if (cause instanceof InvalidFormatException ife) {
      String field = extractJsonPath(ife);
      String expected = ife.getTargetType() != null
        ? ife.getTargetType().getSimpleName()
        : "hợp lệ";
      String reason = "Giá trị không đúng định dạng kiểu " + expected;
      if (!field.isBlank()) {
        return ResponseEntity.badRequest().body(
          ApiResponse.validationError(
            "Trường '" + field + "' không đúng định dạng (yêu cầu kiểu " + expected + ")",
            Map.of(field, reason)
          )
        );
      }
      return ResponseEntity.badRequest().body(ApiResponse.error(reason));
    }
    if (cause instanceof MismatchedInputException mie) {
      String field = extractJsonPath(mie);
      if (!field.isBlank()) {
        String reason = "Kiểu dữ liệu không khớp hoặc cấu trúc JSON không hợp lệ";
        return ResponseEntity.badRequest().body(
          ApiResponse.validationError(
            "Trường '" + field + "' không đúng kiểu dữ liệu hoặc định dạng JSON",
            Map.of(field, reason)
          )
        );
      }
    }
    return ResponseEntity.badRequest().body(
      ApiResponse.error("Request body JSON bị thiếu hoặc sai cú pháp")
    );
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiResponse<?>> methodNotSupported(
    HttpRequestMethodNotSupportedException e
  ) {
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(
      ApiResponse.error(
        "Phương thức HTTP " + e.getMethod() + " không được hỗ trợ cho endpoint này"
      )
    );
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ApiResponse<?>> mediaTypeNotSupported(
    HttpMediaTypeNotSupportedException e
  ) {
    return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(
      ApiResponse.error(
        "Content-Type không được hỗ trợ; vui lòng dùng application/json hoặc multipart/form-data"
      )
    );
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<ApiResponse<?>> maxUploadSize(
    MaxUploadSizeExceededException e
  ) {
    return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
      ApiResponse.error("Kích thước tệp tải lên vượt quá giới hạn 10MB")
    );
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiResponse<?>> notFound(NoResourceFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
      ApiResponse.error("Không tìm thấy endpoint hoặc tài nguyên yêu cầu")
    );
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiResponse<?>> accessDenied(AccessDeniedException e) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
      ApiResponse.error("Bạn không có quyền thực hiện thao tác này")
    );
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<?>> error(
    Exception e,
    HttpServletRequest request
  ) {
    log.error(
      "Unhandled API failure: {} {} ({})",
      request.getMethod(),
      request.getRequestURI(),
      e.toString(),
      e
    );
    return ResponseEntity.status(500).body(
      ApiResponse.error("Không thể xử lý yêu cầu. Kiểm tra log máy chủ.")
    );
  }

  private static ResponseEntity<ApiResponse<?>> buildValidationResponse(
    Map<String, String> errors
  ) {
    if (errors.isEmpty()) {
      return ResponseEntity.badRequest().body(
        ApiResponse.error("Dữ liệu đầu vào thiếu hoặc sai định dạng")
      );
    }
    String summary = errors
      .entrySet()
      .stream()
      .map(entry -> entry.getKey() + " (" + entry.getValue() + ")")
      .collect(Collectors.joining("; "));
    return ResponseEntity.badRequest().body(
      ApiResponse.validationError(
        "Dữ liệu đầu vào không hợp lệ: " + summary,
        errors
      )
    );
  }

  private static String extractJsonPath(JsonMappingException ex) {
    return ex
      .getPath()
      .stream()
      .map(ref -> {
        if (ref.getFieldName() != null) return ref.getFieldName();
        if (ref.getIndex() >= 0) return "[" + ref.getIndex() + "]";
        return null;
      })
      .filter(Objects::nonNull)
      .collect(Collectors.joining("."));
  }
}
