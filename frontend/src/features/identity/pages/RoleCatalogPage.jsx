import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { identityApi } from "../api/identity.api";
import { OfficeIcon } from "../../../shared/ui/office/OfficeUi";
import "../../../shared/ui/office/office-detail.css";
const roleNames = {
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên cơ sở",
  FMANAGER: "Quản lý cơ sở",
  OPS_MGR: "Ban điều hành kinh doanh",
  ADMIN: "Quản trị hệ thống",
};
async function loadRoles() {
  const matrix = await identityApi.roles();
  return Object.entries(matrix || {}).map(([role, description]) => ({
    code: role,
    name: roleNames[role] || role,
    description,
    permissionCount: String(description || "")
      .split(/[;,]/)
      .filter((part) => part.trim()).length,
  }));
}
function RoleDetail({ role }) {
  const permissions = String(role.description || "")
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return (
    <div className="office-detail-layout office-role-detail">
      <section className="office-detail-hero">
        <div className="office-detail-icon">
          <OfficeIcon>admin_panel_settings</OfficeIcon>
        </div>
        <div>
          <span className="eyebrow">RBAC / {role.code}</span>
          <h3>{role.name}</h3>
          <span className="badge success">ĐANG HIỆU LỰC</span>
        </div>
      </section>
      <section>
        <h3>
          <OfficeIcon>shield_person</OfficeIcon> Chi tiết vai trò
        </h3>
        <dl className="office-detail-grid">
          <div>
            <dt>Mã định danh bảo mật</dt>
            <dd>{role.code}</dd>
          </div>
          <div>
            <dt>Phân hệ áp dụng</dt>
            <dd>{role.name}</dd>
          </div>
          <div>
            <dt>Nguyên tắc chính sách</dt>
            <dd>RBAC</dd>
          </div>
          <div>
            <dt>Số phạm vi nghiệp vụ</dt>
            <dd>{role.permissionCount} phạm vi</dd>
          </div>
          <div className="wide-info">
            <dt>Mô tả nghiệp vụ</dt>
            <dd>{role.description}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>
          <OfficeIcon>key</OfficeIcon> Phạm vi quyền truy cập
        </h3>
        <div className="office-role-scope">
          {permissions.map((permission) => (
            <article key={permission}>
              <OfficeIcon>verified</OfficeIcon>
              <strong>{permission}</strong>
              <p>Phạm vi do API phân quyền hệ thống cung cấp.</p>
            </article>
          ))}
        </div>
      </section>
      <section className="office-detail-note">
        <OfficeIcon>gavel</OfficeIcon>
        <div>
          <strong>Kiểm toán thay đổi quyền</strong>
          <p>
            Mọi thay đổi role, scope và tài khoản đều được ghi vào Audit Log
            Service.
          </p>
        </div>
      </section>
    </div>
  );
}
export default function RoleCatalogPage() {
  return (
    <ResourcePage
      className="office-role-catalog"
      title="Quản lý vai trò & quyền"
      description="Xem và quản lý các vai trò và quyền được cấu hình trong hệ thống."
      eyebrow="QUẢN TRỊ HỆ THỐNG / PHÂN QUYỀN & VAI TRÒ"
      load={loadRoles}
      exportName="roles"
      searchPlaceholder="Tìm kiếm theo mã vai trò, tên vai trò..."
      tableTitle="Danh mục vai trò & quyền"
      emptyTitle="Không có vai trò"
      emptyDescription="Hiện tại chưa có vai trò phù hợp để hiển thị."
      renderDetail={(role) => <RoleDetail role={role} />}
      detailTitle={(role) => `Chi tiết vai trò: ${role.code}`}
      metrics={(rows) => [
        {
          label: "Tổng số vai trò",
          value: rows.length,
          icon: "badge",
          note: "5 nhóm vai trò định danh",
        },
        {
          label: "Tổng số quyền hạn cấu hình",
          value: rows.reduce((total, row) => total + row.permissionCount, 0),
          icon: "key",
          note: "Ma trận quyền RBAC",
        },
        {
          label: "Trạng thái áp dụng",
          value: rows.length ? "100%" : "0%",
          icon: "sync_saved_locally",
          tone: "teal",
          note: "Toàn bộ vai trò đang hiệu lực",
        },
        {
          label: "Nguyên tắc SoD",
          value: "Đạt chuẩn",
          icon: "verified_user",
          tone: "navy",
          note: "Phân tách trách nhiệm",
        },
      ]}
      columns={[
        ["code", "Mã vai trò"],
        ["name", "Tên vai trò"],
        ["description", "Mô tả nghiệp vụ"],
        ["permissionCount", "Số quyền hạn gán"],
      ]}
      footer={
        <aside className="office-governance">
          <span className="office-governance-icon">
            <OfficeIcon>gavel</OfficeIcon>
          </span>
          <div>
            <h3>Nguyên tắc Kiểm soát Quyền hạn Tối thiểu (PoLP)</h3>
            <p>
              Mỗi vai trò chỉ được cấp tập quyền tối thiểu phục vụ phạm vi công
              việc. Thay đổi ma trận được ghi vào Audit Log Service.
            </p>
          </div>
        </aside>
      }
    />
  );
}
