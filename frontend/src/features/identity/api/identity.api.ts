import { request, envelope, json } from "../../../shared/api/http-client";
import type { Row, User } from "../../../shared/types/api";
export const identityApi = {
  login: (data: Row) => envelope<User>("/auth/login", json("POST", data)),
  sendOtp: (data: Row) => envelope<Row>("/auth/send-otp", json("POST", data)),
  verifyOtp: (data: Row) =>
    envelope<User>("/auth/verify-otp", json("POST", data)),
  users: () => request<Row[]>("/auth/users"),
  createUser: (data: Row) => request("/auth/users", json("POST", data)),
  updateUser: (data: Row) =>
    request(`/auth/users/${data.id}`, json("PATCH", data)),
  roles: () => request<Row>("/auth/rbac-matrix"),
  loginHistory: () => request<Row[]>("/auth/login-history"),
};
