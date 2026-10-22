import { request, envelope, json } from "../../../shared/api/http-client";
export const identityApi = {
    login: (data) => envelope("/auth/login", json("POST", data)),
    sendOtp: (data) => envelope("/auth/send-otp", json("POST", data)),
    resendOtp: (email) => envelope("/auth/resend-otp", json("POST", { email })),
    me: () => request("/auth/me"),
    verifyOtp: (data) => envelope("/auth/verify-otp", json("POST", data)),
    users: () => request("/auth/users"),
    createUser: (data) => request("/auth/users", json("POST", data)),
    updateUser: (data) => request(`/auth/users/${data.id}`, json("PATCH", data)),
    roles: () => request("/auth/rbac-matrix"),
    loginHistory: () => request("/auth/login-history"),
};
