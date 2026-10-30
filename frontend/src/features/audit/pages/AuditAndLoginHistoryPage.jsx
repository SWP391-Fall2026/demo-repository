import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { OfficeIcon } from "../../../shared/ui/office/OfficeUi";
import { auditApi } from "../api/audit.api";
export default function AuditAndLoginHistoryPage() {
  return (
    <ResourcePage
      className="office-audit-log"
      details={false}
      title="Nhật ký hệ thống"
      description="Xem thông tin hoạt động được ghi nhận trong hệ thống."
      eyebrow="QUẢN TRỊ HỆ THỐNG / NHẬT KÝ KIỂM TOÁN & HOẠT ĐỘNG"
      load={auditApi.list}
      exportName="audit-logs"
      searchPlaceholder="Tìm kiếm theo người thực hiện, đối tượng..."
      tableTitle="Audit Logs • WORM Storage"
      emptyTitle="Chưa có dữ liệu nhật ký"
      emptyDescription="Hiện tại chưa có hoạt động phù hợp để hiển thị."
      metrics={(rows) => [
        {
          label: "Tổng sự kiện ghi nhận",
          value: rows.length,
          icon: "event_note",
          note: "Toàn bộ phân hệ",
        },
        {
          label: "Xác thực & truy cập",
          value: rows.filter((row) =>
            /login|auth|token/i.test(String(row.action)),
          ).length,
          icon: "badge",
          note: "Đăng nhập và phiên",
        },
        {
          label: "Cấu hình & phân quyền",
          value: rows.filter((row) =>
            /role|account|user/i.test(String(row.action)),
          ).length,
          icon: "manage_accounts",
          tone: "teal",
          note: "Tài khoản và RBAC",
        },
        {
          label: "Tính bất biến bản ghi",
          value: rows.length ? "100%" : "—",
          icon: "verified_user",
          tone: "navy",
          note: "ISO/IEC 27001",
        },
      ]}
      columns={[
        ["timeStr", "Thời gian (Timestamp)"],
        ["userName", "Người thực hiện"],
        ["action", "Hành động"],
        ["entityId", "Đối tượng"],
        ["status", "Trạng thái"],
        ["detail", "Chi tiết kiểm toán"],
      ]}
      filters={[
        { key: "role", label: "Người thực hiện" },
        { key: "action", label: "Hành động" },
        { key: "status", label: "Trạng thái" },
      ]}
      footer={
        <aside className="office-governance">
          <span className="office-governance-icon">
            <OfficeIcon>gavel</OfficeIcon>
          </span>
          <div>
            <h3>Cơ chế Kiểm toán Bất biến (WORM — Write Once, Read Many)</h3>
            <p>
              Nhật ký có tính chất pháp lý, không chỉnh sửa, cập nhật thời gian
              hoặc xóa dữ liệu đã lưu.
            </p>
          </div>
        </aside>
      }
    />
  );
}
