import { buildProperties } from "./properties.mjs";
const form = document.querySelector("#setup");
const otp = document.querySelector("#otp");
const mail = document.querySelector("#mail-settings");
const status = document.querySelector("#status");

function updateMode() {
  mail.disabled = otp.value !== "email";
}
otp.addEventListener("change", updateMode);
updateMode();

document.querySelector("#generate-key").addEventListener("click", () => {
  try {
    const bytes = new Uint8Array(64);
    crypto.getRandomValues(bytes);
    document.querySelector("#jwt").value = btoa(String.fromCharCode(...bytes));
    status.textContent = "Đã tạo khóa trong ô JWT. Giá trị không được ghi log hoặc gửi qua mạng.";
  } catch {
    status.textContent = "Không tạo được khóa. Bạn có thể nhập khóa riêng đã tạo trên máy.";
  }
});

form.addEventListener("submit", event => {
  event.preventDefault();
  status.textContent = "";
  if (!form.reportValidity()) return;
  try {
    const read = id => document.getElementById(id).value;
    const content = buildProperties({
      host: read("host"), port: read("port"), database: read("database"), user: read("user"),
      password: read("db-password"), jwt: read("jwt"), origin: read("origin"),
      ssl: read("ssl"), ca: read("ca"), otp: read("otp"),
      smtpHost: read("smtp-host"), smtpPort: read("smtp-port"),
      smtpUser: read("smtp-user"), smtpPassword: read("smtp-password"), mailFrom: read("mail-from"),
    });
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const download = document.createElement("a");
    download.href = url;
    download.download = "storage-rental-staging.private.properties";
    document.body.appendChild(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    for (const input of document.querySelectorAll(".secret")) input.value = "";
    status.textContent = "Đã tạo bản cấu hình và yêu cầu tải xuống. Sau khi lưu, cất file ngoài repository và gửi chỉ đường dẫn file trong chat; không gửi nội dung. Chưa có kết nối Supabase, SMTP hoặc API nào được thực hiện.";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Không tạo được file cấu hình.";
  }
});
