import type { RegistrationRequest } from "../types/auth";

export function registrationPayload(input: Record<string, unknown>): RegistrationRequest {
  const text = (key: string) => typeof input[key] === "string" ? input[key] as string : "";
  return {
    name: text("name").trim(),
    username: text("username").trim().toLowerCase(),
    email: text("email").trim().toLowerCase(),
    phone: text("phone").replace(/[\s.-]/g, ""),
    cccd: text("cccd").replace(/\s/g, ""),
    facilityCode: text("facilityCode").trim() || undefined,
    // Do not reuse identity normalization for credentials.
    password: text("password"),
    confirmPassword: text("confirmPassword"),
  };
}

export function registrationError(data: RegistrationRequest): string | undefined {
  if (data.name.length < 2 || data.name.length > 50 || !/^[\p{L}\p{M}\s]+$/u.test(data.name))
    return "Họ và tên phải gồm 2–50 ký tự chữ.";
  if (!/^[a-z_][a-z0-9_]{3,19}$/.test(data.username))
    return "Tên đăng nhập gồm 4–20 chữ, số hoặc dấu gạch dưới, không bắt đầu bằng số.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return "Email không hợp lệ.";
  if (!/^(03|05|07|08|09)[0-9]{8}$/.test(data.phone))
    return "Số điện thoại Việt Nam phải có 10 chữ số.";
  if (!/^[0-9]{12}$/.test(data.cccd))
    return "CCCD phải có 12 chữ số.";
  if (!/\S/u.test(data.password))
    return "Mật khẩu không được chỉ chứa khoảng trắng.";
  if (data.password.length < 6)
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  if (/[\uD800-\uDFFF]/u.test(data.password))
    return "Mật khẩu chứa ký tự Unicode không hợp lệ.";
  if (new TextEncoder().encode(data.password).byteLength > 72)
    return "Mật khẩu không được vượt quá 72 byte UTF-8.";
  if (data.password !== data.confirmPassword)
    return "Mật khẩu xác nhận không khớp.";
  return undefined;
}
