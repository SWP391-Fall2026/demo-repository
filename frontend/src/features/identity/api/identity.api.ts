import { request, envelope, json } from "../../../shared/api/http-client";
import type { Row, User } from "../../../shared/types/api";
import type { RegistrationRequest, OtpChallenge, RegistrationResult } from "../types/auth";
export const identityApi = {
  login: (data: Row) => envelope<User>("/auth/login", json("POST", data)),
  sendOtp: (data: RegistrationRequest) => envelope<OtpChallenge>("/auth/send-otp", json("POST", data)),
  resendOtp: (email: string) => envelope<OtpChallenge>("/auth/resend-otp", json("POST", { email })),
  me: () => request<User>("/auth/me"),
  verifyOtp: (data: Row) =>
    envelope<RegistrationResult>("/auth/verify-otp", json("POST", data)),
  users: () => request<Row[]>("/auth/users"),
  createUser: (data: Row) => request("/auth/users", json("POST", data)),
  updateUser: (data: Row) =>
    request(`/auth/users/${data.id}`, json("PATCH", data)),
  roles: () => request<Row>("/auth/rbac-matrix"),
  loginHistory: () => request<Row[]>("/auth/login-history"),
};
