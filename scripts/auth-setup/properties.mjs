export function escapeProperty(value) {
  let output = "";
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    const n = value.charCodeAt(i);
    if (c === "\\") output += "\\\\";
    else if (c === "\n") output += "\\n";
    else if (c === "\r") output += "\\r";
    else if (c === "\t") output += "\\t";
    else if (c === "\f") output += "\\f";
    else if (" =:#!".includes(c)) output += "\\" + c;
    else if (n < 32 || n > 126) output += "\\u" + n.toString(16).padStart(4, "0");
    else output += c;
  }
  return output;
}

export function buildProperties(values) {
  const host = values.host.trim();
  const database = values.database.trim();
  const user = values.user.trim();
  const port = Number(values.port);
  if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9_-]+$/i.test(database) || !user)
    throw new Error("Host, database hoặc DB user không hợp lệ. Không nhập connection string vào ô host.");
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Port phải từ 1 đến 65535.");
  if (!values.password) throw new Error("Bạn chưa nhập DB password.");
  if ([values.password, values.jwt, values.smtpPassword, values.smtpUser]
      .some(value => (value || "").includes("$" + "{"))) {
    throw new Error("Secret chứa cú pháp placeholder của Spring. Không sửa hoặc gửi secret vào chat; báo để chuẩn bị cách nạp nguyên chuỗi trước khi chạy.");
  }
  if (new TextEncoder().encode(values.jwt).byteLength < 32 || !values.jwt.trim())
    throw new Error("JWT key cần ít nhất 32 byte; nên dùng nút tạo khóa ngẫu nhiên.");
  if (!["disabled", "mock", "email"].includes(values.otp))
    throw new Error("Chế độ OTP không hợp lệ.");
  if (!["require", "verify-full"].includes(values.ssl))
    throw new Error("SSL phải là require hoặc verify-full.");
  if (values.ssl === "verify-full" && !values.ca.trim())
    throw new Error("SSL verify-full cần đường dẫn CA certificate trên máy backend.");
  let origin;
  try {
    const parsed = new URL(values.origin);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password
        || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error();
    origin = parsed.origin;
  } catch {
    throw new Error("Frontend origin chỉ gồm http(s), host và port; không có path hoặc credential.");
  }
  let url = "jdbc:postgresql://" + host + ":" + port + "/" + database + "?sslmode=" + values.ssl;
  if (values.ssl === "verify-full") url += "&sslrootcert=" + encodeURIComponent(values.ca.trim());
  const props = {
    "spring.profiles.active": values.otp === "mock" ? "auth-supabase,auth-test" : "auth-supabase",
    SUPABASE_DB_URL: url,
    SUPABASE_DB_USERNAME: user,
    SUPABASE_DB_PASSWORD: values.password,
    JWT_SECRET: values.jwt,
    AUTH_SCHEMA_REVIEWED: "false",
    AUTH_OTP_DELIVERY: values.otp,
    FRONTEND_ORIGIN: origin,
    "spring.jpa.hibernate.ddl-auto": "validate",
    "app.scheduling.enabled": "false",
  };
  if (values.otp === "email") {
    const smtpPort = Number(values.smtpPort);
    if (!values.smtpHost.trim() || !values.mailFrom.trim() || !values.smtpUser || !values.smtpPassword
        || !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535)
      throw new Error("OTP email cần SMTP host, port, username, password và địa chỉ gửi hợp lệ.");
    Object.assign(props, {
      AUTH_SMTP_HOST: values.smtpHost.trim(),
      AUTH_SMTP_PORT: String(smtpPort),
      AUTH_SMTP_USERNAME: values.smtpUser,
      AUTH_SMTP_PASSWORD: values.smtpPassword,
      AUTH_MAIL_FROM: values.mailFrom.trim(),
    });
  }
  return "# PRIVATE - contains secrets. Keep outside Git; never upload to chat.\n"
      + "# Generated locally. No connection performed. Schema guard intentionally remains false.\n"
      + Object.entries(props).map(([key, value]) => key + "=" + escapeProperty(value)).join("\n") + "\n";
}
