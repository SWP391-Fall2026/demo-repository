# Hợp đồng API

`openapi/storage-rental.openapi.json` mô tả API hiện tại; `route-inventory.json` liệt kê 66 mapping controller (gồm alias).

Chạy `npm run check:contract` để kiểm tra route, tham chiếu schema, path parameters và lời gọi frontend. Đây là kiểm tra tĩnh, không phải kiểm chứng runtime response theo OpenAPI. Nhiều response.data còn là Envelope chung; không tự suy ra kiểu dữ liệu từ nó.

Authentication: Bearer JWT. Các route giữ prefix /api. Ngày giờ nghiệp vụ theo Asia/Ho_Chi_Minh, giá trị LocalDateTime không có offset; tiền VND dùng decimal. Chính sách quyền chi nhánh/chủ sở hữu được kiểm tra lại phía service.

Request mẫu và lỗi/nghiệp vụ trọng yếu được kiểm tra qua RentalLifecycleTest, BusinessRulesTest và idempotent-request.test.ts.
