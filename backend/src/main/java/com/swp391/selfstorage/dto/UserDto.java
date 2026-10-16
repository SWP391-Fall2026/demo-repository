package com.swp391.selfstorage.dto;

import com.swp391.selfstorage.entity.User;

public class UserDto {
    private String id;
    private String name;
    private String username;
    private String email;
    private String phone;
    private String cccd;
    private String role;
    private String roleTitle;
    private String facility;
    private String facilityCode;
    private String status;
    private boolean emailVerified;

    public UserDto() {}

    public UserDto(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.cccd = user.getCccd();
        this.role = user.getRole();
        this.roleTitle = user.getRoleTitle();
        this.facility = user.getFacility();
        this.facilityCode = user.getFacilityCode();
        this.status = user.getStatus();
        this.emailVerified = user.isEmailVerified();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCccd() { return cccd; }
    public void setCccd(String cccd) { this.cccd = cccd; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getRoleTitle() { return roleTitle; }
    public void setRoleTitle(String roleTitle) { this.roleTitle = roleTitle; }

    public String getFacility() { return facility; }
    public void setFacility(String facility) { this.facility = facility; }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
}
