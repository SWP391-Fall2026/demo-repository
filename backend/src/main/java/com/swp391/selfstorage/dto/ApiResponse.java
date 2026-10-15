package com.swp391.selfstorage.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String token;
    private Integer count;
    private String code;
    private String email;

    public ApiResponse() {}

    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(boolean success, String message, T data, String token) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.token = token;
    }

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> resp = new ApiResponse<>(true, null, data);
        return resp;
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> ok(String message, T data, String token) {
        return new ApiResponse<>(true, message, data, token);
    }

    public static <T> ApiResponse<T> list(int count, T data) {
        ApiResponse<T> resp = new ApiResponse<>(true, null, data);
        resp.setCount(count);
        return resp;
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
