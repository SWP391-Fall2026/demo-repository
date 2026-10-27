# Microservice: API Gateway & Routing (Service 0)

Dịch vụ Cổng vào duy nhất (Single Entry Point) cho toàn bộ hệ thống Quản lý và Cho thuê Kho Lưu Trữ Tự Phục Vụ (Self-Storage Facility Rental and Management System).

---

## 1. Trách nhiệm cốt lõi theo thiết kế
- **Cổng vào duy nhất (Reverse Proxy & Routing):** Tiếp nhận toàn bộ request từ Client Web Portal, định tuyến thông minh:
  - `/api/**` $\rightarrow$ Chuyển tiếp tới **Backend Spring Boot Core Services** (`http://localhost:8080`)
  - `/**` $\rightarrow$ Chuyển tiếp tới **Frontend Web Portal (React / Vite)** (`http://localhost:5173`)
- **Giới hạn tần suất truy cập (Rate Limiting):**
  - Thuật toán **Token Bucket** thread-safe kiểm soát theo từng IP của Client.
  - Ngăn chặn tấn công DDoS, quét tự động và brute force.
  - Trả về mã lỗi chuẩn `HTTP 429 Too Many Requests` kèm headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.
- **Bảo mật SSL / HTTPS:**
  - Hỗ trợ chạy SSL/TLS qua cổng an toàn `8443`.
  - Tích hợp sẵn PKCS12 Keystore (`gateway.p12`) tự sinh với mã khóa RSA 2048-bit.
- **Truy vết phân tán (Distributed Tracing & Logging):**
  - Tự động sinh hoặc kế thừa header `X-Request-Id` qua toàn bộ chuỗi microservices.
  - Ghi log chi tiết: Method, URI, Remote IP, HTTP Status code và độ trễ xử lý (Latency tính bằng mili-giây).
- **CORS tập trung (Gateway-Level CORS):**
  - Quản lý chính sách chia sẻ tài nguyên chéo cho mọi domain client mà không cần cấu hình lặp lại ở từng service nội bộ.
- **Giám sát & Quản trị tuyến (Actuator Gateway):**
  - Cung cấp API `/actuator/gateway/routes` để kiểm tra các tuyến đang hoạt động.
  - Kiểm tra trạng thái `/actuator/health`.

---

## 2. Cấu trúc thư mục

```text
api-gateway/
├── pom.xml                                   # Quản lý dependencies (Spring Cloud Gateway, Actuator, Reactor Test)
├── generate-ssl-keystore.bat                 # Script tái tạo chứng chỉ SSL/TLS
├── README.md                                 # Hướng dẫn chi tiết
├── src/
│   ├── main/
│   │   ├── java/com/swp391/gateway/
│   │   │   ├── ApiGatewayApplication.java    # Main Entrypoint Spring Boot
│   │   │   ├── config/
│   │   │   │   └── CorsConfig.java           # Cấu hình CORS WebFlux toàn cục
│   │   │   └── filter/
│   │   │       ├── RateLimiterGatewayFilterFactory.java # Filter Rate Limiting Token Bucket
│   │   │       └── LoggingGlobalFilter.java  # Global Filter đo latency & gán X-Request-Id
│   │   └── resources/
│   │       ├── application.yml               # Cấu hình cổng 8000, routes & rate limit
│   │       ├── application-ssl.yml           # Profile SSL chạy cổng HTTPS 8443
│   │       └── keystore/
│   │           └── gateway.p12               # PKCS12 Keystore chứng thực SSL
│   └── test/
│       ├── java/com/swp391/gateway/
│       │   └── ApiGatewayApplicationTests.java # Unit tests xác thực Context & Rate Limiter 429
│       └── resources/
│           └── application-test.yml
```

---

## 3. Hướng dẫn chạy và kiểm thử

### Yêu cầu tiên quyết
- **Java 21 LTS**
- **Maven 3.9+**

### Chạy Gateway chế độ HTTP thông thường (Cổng 8000)
```powershell
mvn -f api-gateway/pom.xml spring-boot:run
```
Cổng dịch vụ: `http://localhost:8000`

### Chạy Gateway chế độ Bảo mật HTTPS / SSL (Cổng 8443)
```powershell
mvn -f api-gateway/pom.xml spring-boot:run -Dspring-boot.run.profiles=ssl
```
Cổng an toàn: `https://localhost:8443`

### Chạy từ tệp JAR đã đóng gói
```powershell
java -jar api-gateway/target/selfstorage-gateway-1.0.0.jar
```

### Chạy Unit Test kiểm thử
```powershell
mvn -f api-gateway/pom.xml clean test
```
Xác nhận kịch bản kiểm tra:
1. `contextLoads()`: Khởi động thành công toàn bộ Route & Bean Gateway.
2. `testRateLimiterRejection()`: Giả lập gửi request dồn dập, kiểm tra Gateway kích hoạt cơ chế chặn 429 và gắn đúng header `X-RateLimit-Remaining: 0`.

---

## 4. Kiểm tra hoạt động thực tế

Khi cả Frontend (`:5173`), Backend (`:8080`) và Gateway (`:8000`) đều chạy:
1. Truy cập Web Portal qua Gateway: `http://localhost:8000/` (Gateway sẽ reverse proxy về frontend Vite).
2. Gọi API qua Gateway: `http://localhost:8000/api/facilities` (Gateway sẽ reverse proxy về Spring Boot backend).
3. Kiểm tra danh sách tuyến định tuyến: `http://localhost:8000/actuator/gateway/routes`.
4. Xem header trả về trong Network tab của trình duyệt:
   - `X-Request-Id: <uuid>`
   - `X-Gateway-Server: SelfStorage-API-Gateway`
   - `X-RateLimit-Limit: 60`
   - `X-RateLimit-Remaining: <số_lượng_còn_lại>`
