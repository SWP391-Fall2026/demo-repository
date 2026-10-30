import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { identityApi } from "../api/identity.api";
import { facilityApi } from "../../facility/api/facility.api";
import { useRemote } from "../../../shared/api/use-remote";
import { useContext, useState } from "react";
import { ReloadContext } from "../../../shared/ui/resource-context";
import { OfficeIcon } from "../../../shared/ui/office/OfficeUi";
import "../../../shared/ui/office/office-detail.css";

const roleOptions = [
  ["FMANAGER", "Facility Manager"],
  ["STAFF", "Facility Staff"],
  ["OPS_MGR", "Business Operation Manager"],
  ["ADMIN", "Admin"],
];
function CreateStaffForm() {
  const facilities = useRemote(facilityApi.facilities);
  const [role, setRole] = useState("STAFF");
  const reload = useContext(ReloadContext);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function createStaff(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    data.role = role;
    if (role === "ADMIN" || role === "OPS_MGR") delete data.facilityCode;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await identityApi.createUser(data);
      form.reset();
      setRole("STAFF");
      setMessage(
        "Tài khoản đã tạo. Gửi mật khẩu tạm thời qua kênh riêng an toàn.",
      );
      reload?.();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không tạo được tài khoản.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-grid" onSubmit={createStaff}>
      <label>
        Họ và tên
        <input name="name" required minLength={2} maxLength={50} />
      </label>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <label>
        Số điện thoại
        <input
          name="phone"
          type="tel"
          required
          pattern="(03|05|07|08|09)[0-9]{8}"
        />
      </label>
      <label>
        CCCD
        <input
          name="cccd"
          inputMode="numeric"
          required
          pattern="[0-9]{12}"
          maxLength={12}
        />
      </label>
      <label>
        Tên đăng nhập
        <input
          name="username"
          required
          minLength={4}
          maxLength={20}
          pattern="[A-Za-z_][A-Za-z0-9_]{3,19}"
        />
      </label>
      <label>
        Loại tài khoản
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {roleOptions.map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {(role === "FMANAGER" || role === "STAFF") && (
        <label>
          Cơ sở phụ trách
          <select
            name="facilityCode"
            required
            defaultValue=""
            disabled={facilities.busy || Boolean(facilities.error)}
          >
            <option value="" disabled>
              {facilities.busy ? "Đang tải cơ sở..." : "Chọn cơ sở"}
            </option>
            {(facilities.data || [])
              .filter(
                (facility) =>
                  String(facility.status).toUpperCase() === "ACTIVE",
              )
              .map((facility) => (
                <option
                  key={String(facility.code)}
                  value={String(facility.code)}
                >
                  {String(facility.name)} ({String(facility.code)})
                </option>
              ))}
          </select>
        </label>
      )}
      <label>
        Mật khẩu tạm thời
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? "Đang tạo..." : "Tạo tài khoản nội bộ"}
        </button>
      </div>
    </form>
  );
}
function UserDetail({ user, onSaved }) {
  const facilities = useRemote(facilityApi.facilities);
  const [form, setForm] = useState({
    role: user.role || "CUSTOMER",
    status: user.status || "ACTIVE",
    facilityCode: user.facilityCode || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await identityApi.updateUser({ id: user.id, ...form });
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không cập nhật được tài khoản.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="office-detail-layout office-account-detail">
      <section className="office-detail-hero">
        <div className="office-detail-icon">
          <OfficeIcon>person</OfficeIcon>
        </div>
        <div>
          <span className="eyebrow">USER / {user.id}</span>
          <h3>{user.name || user.username}</h3>
          <span
            className={`badge ${String(user.status).toUpperCase() === "ACTIVE" ? "success" : "pending"}`}
          >
            {user.status || "—"}
          </span>
        </div>
      </section>
      <section>
        <h3>
          <OfficeIcon>badge</OfficeIcon> Hồ sơ định danh
        </h3>
        <dl className="office-detail-grid">
          {[
            ["Mã người dùng", user.id],
            ["Tên đăng nhập", user.username],
            ["Email", user.email],
            ["Vai trò", user.role],
            ["Cơ sở", user.facility || user.facilityCode || "—"],
            ["Ngày tạo", user.createdAt || "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
      <form className="office-detail-form form-grid" onSubmit={save}>
        <h3>Chỉnh sửa quyền hạn &amp; trạng thái</h3>
        <label>
          Vai trò
          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({ ...current, role: event.target.value }))
            }
          >
            {[["CUSTOMER", "Khách hàng"], ...roleOptions].map(
              ([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Trạng thái
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value }))
            }
          >
            {["ACTIVE", "LOCKED", "DISABLED"].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {["STAFF", "FMANAGER"].includes(form.role) && (
          <label>
            Cơ sở phụ trách
            <select
              value={form.facilityCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  facilityCode: event.target.value,
                }))
              }
              required
            >
              <option value="">Chọn cơ sở</option>
              {(facilities.data || [])
                .filter(
                  (facility) =>
                    String(facility.status).toUpperCase() === "ACTIVE",
                )
                .map((facility) => (
                  <option key={facility.code} value={facility.code}>
                    {facility.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button disabled={busy}>
            {busy ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
      <section className="office-detail-note">
        <OfficeIcon>shield</OfficeIcon>
        <div>
          <strong>Dữ liệu nhạy cảm được bảo vệ</strong>
          <p>
            Mật khẩu, CCCD, token và mã OTP không hiển thị, không xuất ra CSV.
          </p>
        </div>
      </section>
    </div>
  );
}
export default function UserManagementPage() {
  return (
    <ResourcePage
      className="office-user-accounts"
      title="Quản trị người dùng & tài khoản"
      description="Quản lý tài khoản Customer, Staff, Manager, BOM và Admin theo phân quyền hệ thống."
      eyebrow="QUẢN TRỊ HỆ THỐNG / QUẢN LÝ TÀI KHOẢN"
      load={identityApi.users}
      exportName="users"
      actionLabel="Thêm tài khoản mới"
      searchPlaceholder="Tìm kiếm theo mã người dùng, tên tài khoản hoặc email..."
      tableTitle="Hồ sơ định danh tài khoản"
      emptyTitle="Không có tài khoản"
      emptyDescription="Hiện tại chưa có tài khoản phù hợp để hiển thị. Vui lòng kiểm tra lại bộ lọc hoặc làm mới dữ liệu."
      renderDetail={(user, onSaved) => (
        <UserDetail user={user} onSaved={onSaved} />
      )}
      detailTitle={(user) => `Chi tiết tài khoản: ${user.id || user.username}`}
      metrics={(rows) => [
        {
          label: "Tổng tài khoản hệ thống",
          value: rows.length,
          icon: "group",
          note: "Theo quyền truy cập Admin",
        },
        {
          label: "Khách hàng",
          value: rows.filter((row) => row.role === "CUSTOMER").length,
          icon: "person",
          note: "Cổng khách hàng",
        },
        {
          label: "Nhân sự nội bộ",
          value: rows.filter((row) =>
            ["STAFF", "FMANAGER", "OPS_MGR"].includes(row.role),
          ).length,
          icon: "badge",
          tone: "teal",
          note: "Staff, Manager & BOM",
        },
        {
          label: "Quản trị viên",
          value: rows.filter((row) => row.role === "ADMIN").length,
          icon: "admin_panel_settings",
          tone: "navy",
          note: "Quản trị hệ thống",
        },
      ]}
      columns={[
        ["id", "Mã người dùng"],
        ["name", "Tên tài khoản / Họ tên"],
        ["email", "Email"],
        ["role", "Vai trò"],
        ["status", "Trạng thái"],
        ["facilityCode", "Cơ sở"],
      ]}
      filters={[
        { key: "role", label: "Vai trò" },
        { key: "status", label: "Trạng thái" },
      ]}
      footer={
        <aside className="office-governance">
          <span className="office-governance-icon">
            <OfficeIcon>verified_user</OfficeIcon>
          </span>
          <div>
            <h3>Nguyên tắc bảo mật &amp; quản trị định danh (ISO-27001)</h3>
            <p>
              Chỉ hiển thị và cập nhật dữ liệu định danh được cấp quyền. Mật
              khẩu, mã hash, OTP và access token không xuất hiện trên giao diện
              quản trị.
            </p>
          </div>
        </aside>
      }
    >
      <CreateStaffForm />
    </ResourcePage>
  );
}
