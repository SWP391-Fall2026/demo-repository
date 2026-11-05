import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { auditApi } from "../api/audit.api";

const auditColumns = [
    ["timeStr", "Thời gian"],
    ["userName", "Tài khoản"],
    ["role", "Vai trò"],
    ["action", "Thao tác / Hành vi"],
    ["detail", "Chi tiết sự kiện"],
    ["ip", "Địa chỉ IP"],
    ["status", "Trạng thái"],
];

export default function AuditAndLoginHistoryPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / BẢO MẬT & TRUY VẾT"
            title="Nhật ký hoạt động & Đăng nhập hệ thống"
            description="Truy vết toàn bộ các thao tác quản trị, đăng nhập và thay đổi cấu hình nhạy cảm theo thời gian thực."
            load={auditApi.list}
            columns={auditColumns}
        />
    );
}
