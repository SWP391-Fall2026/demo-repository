package com.swp391.selfstorage.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

@Service
public class EmailService {

    private final JavaMailSender initialMailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${app.mail.from-name:STORAGE System}")
    private String senderName;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.initialMailSender = mailSender;
    }

    /**
     * Gửi trực tiếp mã PIN xác thực tới địa chỉ email đăng ký tài khoản
     * @param toEmail Địa chỉ email của tài khoản đăng ký
     * @param pinCode Mã PIN xác nhận (6 chữ số)
     */
    public void sendOtpEmail(String toEmail, String pinCode) {
        JavaMailSender activeSender = getEffectiveMailSender();

        if (activeSender == null || senderEmail == null || senderEmail.trim().isEmpty()) {
            System.err.println("[EmailService] ⚠️ Chưa cấu hình MAIL_USERNAME / MAIL_PASSWORD trong .env!");
            throw new IllegalStateException("Hệ thống chưa có thông tin tài khoản gửi thư! Vui lòng điền MAIL_USERNAME và MAIL_PASSWORD (mật khẩu ứng dụng Gmail 16 chữ số) trong file .env để gửi trực tiếp mã PIN về email " + toEmail);
        }

        try {
            MimeMessage message = activeSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, senderName);
            helper.setTo(toEmail.trim());
            helper.setSubject("[STORAGE] Mã PIN xác nhận đăng ký tài khoản của bạn: " + pinCode);

            String htmlContent = buildOtpHtmlTemplate(pinCode, toEmail.trim());
            helper.setText(htmlContent, true);

            activeSender.send(message);
            System.out.println("[EmailService] 📧 Đã gửi trực tiếp mã PIN xác nhận tới email [" + toEmail + "] thành công!");
        } catch (MessagingException e) {
            System.err.println("[EmailService] ❌ Lỗi gửi email tới " + toEmail + ": " + e.getMessage());
            throw new IllegalStateException("Không thể gửi email tới " + toEmail + ": " + e.getMessage());
        } catch (Exception e) {
            System.err.println("[EmailService] ❌ Lỗi kết nối máy chủ thư: " + e.getMessage());
            throw new IllegalStateException("Lỗi gửi email: " + e.getMessage() + ". Vui lòng kiểm tra lại mật khẩu ứng dụng Gmail trong file .env!");
        }
    }

    private JavaMailSender getEffectiveMailSender() {
        // Tự động kiểm tra và đọc file .env trực tiếp để áp dụng ngay lập tức khi người dùng lưu file .env
        Map<String, String> envProps = loadEnvFile();
        String envUser = envProps.get("MAIL_USERNAME");
        String envPass = envProps.get("MAIL_PASSWORD");

        if (envUser != null && !envUser.trim().isEmpty() && envPass != null && !envPass.trim().isEmpty()) {
            this.senderEmail = envUser.trim();
            if (envProps.get("MAIL_FROM_NAME") != null && !envProps.get("MAIL_FROM_NAME").isEmpty()) {
                this.senderName = envProps.get("MAIL_FROM_NAME");
            }

            JavaMailSenderImpl customSender = new JavaMailSenderImpl();
            customSender.setHost(envProps.getOrDefault("MAIL_HOST", "smtp.gmail.com"));
            try {
                customSender.setPort(Integer.parseInt(envProps.getOrDefault("MAIL_PORT", "587")));
            } catch (Exception e) {
                customSender.setPort(587);
            }
            customSender.setUsername(this.senderEmail);
            // Xóa khoảng trắng nếu người dùng copy mật khẩu ứng dụng dạng "xxxx xxxx xxxx xxxx"
            customSender.setPassword(envPass.trim().replaceAll("\\s+", ""));

            Properties props = customSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.connectiontimeout", "8000");
            props.put("mail.smtp.timeout", "8000");
            props.put("mail.smtp.writetimeout", "8000");

            return customSender;
        }

        if (this.initialMailSender != null && this.senderEmail != null && !this.senderEmail.trim().isEmpty()) {
            return this.initialMailSender;
        }

        return null;
    }

    private Map<String, String> loadEnvFile() {
        Map<String, String> map = new HashMap<>();
        String[] potentialPaths = {
                ".env",
                "../.env",
                System.getProperty("user.dir") + "/.env",
                System.getProperty("user.dir") + "/../.env",
                "d:/Kỳ 7/SWP/Project/.env"
        };
        for (String p : potentialPaths) {
            File f = new File(p);
            if (f.exists() && f.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(f, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String k = line.substring(0, eq).trim();
                            String v = line.substring(eq + 1).trim();
                            if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
                                v = v.substring(1, v.length() - 1);
                            }
                            map.put(k, v);
                        }
                    }
                    if (map.containsKey("MAIL_USERNAME") && !map.get("MAIL_USERNAME").isEmpty()) {
                        break;
                    }
                } catch (Exception ignored) {}
            }
        }
        return map;
    }

    private String buildOtpHtmlTemplate(String pinCode, String recipientEmail) {
        return "<!DOCTYPE html>"
                + "<html lang=\"vi\">"
                + "<head><meta charset=\"UTF-8\"></head>"
                + "<body style=\"font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px;\">"
                + "  <div style=\"max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;\">"
                + "    <div style=\"background: linear-gradient(135deg, #1e40af, #2563eb); padding: 32px 24px; text-align: center; color: #ffffff;\">"
                + "      <h1 style=\"margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1.5px;\">STORAGE</h1>"
                + "      <p style=\"margin: 8px 0 0; font-size: 13.5px; opacity: 0.9;\">Hệ Thống Quản Lý & Cho Thuê Kho Lưu Trữ Tự Phục Vụ</p>"
                + "    </div>"
                + "    <div style=\"padding: 36px 32px;\">"
                + "      <h2 style=\"margin: 0 0 14px; font-size: 20px; color: #0f172a; font-weight: 700;\">Mã PIN xác nhận tài khoản</h2>"
                + "      <p style=\"margin: 0 0 16px; font-size: 14.5px; line-height: 1.6; color: #475569;\">"
                + "        Kính chào Quý khách,<br>"
                + "        Bạn vừa thực hiện đăng ký tài khoản trên hệ thống STORAGE cho email: <strong style=\"color:#1e40af;\">" + recipientEmail + "</strong>."
                + "      </p>"
                + "      <p style=\"margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;\">"
                + "        Dưới đây là mã PIN xác nhận bảo mật của bạn. Vui lòng nhập mã này vào trang đăng ký để hoàn tất:"
                + "      </p>"
                + "      <div style=\"background: #f8fafc; border: 2px dashed #2563eb; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0;\">"
                + "        <div style=\"font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 8px;\">MÃ PIN XÁC NHẬN CỦA BẠN</div>"
                + "        <div style=\"font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', monospace;\">" + pinCode + "</div>"
                + "        <div style=\"font-size: 13px; color: #dc2626; margin-top: 10px; font-weight: 600;\">⏱️ Mã có hiệu lực trong vòng 5 phút</div>"
                + "      </div>"
                + "      <p style=\"margin: 0 0 12px; font-size: 13.5px; line-height: 1.6; color: #64748b;\">"
                + "        ⚠️ <strong>Lưu ý bảo mật:</strong> Không cung cấp mã PIN này cho bất kỳ ai. STORAGE không bao giờ yêu cầu bạn cung cấp mã xác nhận qua điện thoại hoặc tin nhắn."
                + "      </p>"
                + "      <p style=\"margin: 0; font-size: 13.5px; line-height: 1.6; color: #64748b;\">"
                + "        Nếu bạn không tạo tài khoản này, vui lòng bỏ qua thư này."
                + "      </p>"
                + "    </div>"
                + "    <div style=\"background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8;\">"
                + "      © 2026 STORAGE System - Đồ án SWP391. Email được gửi tự động trực tiếp đến hộp thư của bạn."
                + "    </div>"
                + "  </div>"
                + "</body>"
                + "</html>";
    }
}
