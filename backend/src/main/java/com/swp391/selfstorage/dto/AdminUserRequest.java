package com.swp391.selfstorage.dto;

public class AdminUserRequest {
    private String name;
    private String username;
    private String password;
    private String email;
    private String phone;
    private String cccd;
    private String role;
    private String facility;
    private String facilityCode;
    private String status;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCccd() { return cccd; }
    public void setCccd(String cccd) { this.cccd = cccd; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getFacility() { return facility; }
    public void setFacility(String facility) { this.facility = facility; }
    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
