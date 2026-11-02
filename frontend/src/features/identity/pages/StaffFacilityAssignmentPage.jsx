import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { OfficeIcon } from "../../../shared/ui/office/OfficeUi";
import { facilityApi } from "../../facility/api/facility.api";
import { identityApi } from "../api/identity.api";

const STAFF_ROLES = ["STAFF", "FMANAGER"];
const loadStaff = async () => (await identityApi.users()).filter((user) => STAFF_ROLES.includes(user.role));

function AssignmentDetail({ user, onSaved }) {
  const facilities = useRemote(facilityApi.facilities);
  const [facilityCode, setFacilityCode] = useState(user.facilityCode || "");
  const [role, setRole] = useState(user.role || "STAFF");
  const [status, setStatus] = useState(user.status || "ACTIVE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await identityApi.updateUser({ id: user.id, role, status, facilityCode });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể cập nhật phân công.");
    } finally {
      setBusy(false);
    }
  }

  const activeFacilities = (facilities.data || []).filter(
    (facility) => String(facility.status).toUpperCase() === "ACTIVE",
  );
  return (
    <form className="form-grid" onSubmit={save}>
      <p className="office-detail-note">
        <OfficeIcon>person</OfficeIcon>
        <span>{user.name || user.username || user.id} · {user.email || ""}</span>
      </p>
      <label>
        Vai trò
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {STAFF_ROLES.map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        Cơ sở phụ trách
        <select
          value={facilityCode}
          onChange={(event) => setFacilityCode(event.target.value)}
          required
          disabled={facilities.busy || Boolean(facilities.error)}
        >
          <option value="">Chọn cơ sở</option>
          {activeFacilities.map((facility) => (
            <option key={facility.code} value={facility.code}>
              {facility.name} ({facility.code})
            </option>
          ))}
        </select>
      </label>
      <label>
        Trạng thái
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {["ACTIVE", "LOCKED", "DISABLED"].map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
      </label>
      {facilities.error && <p className="error" role="alert">{facilities.error}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={busy || facilities.busy || Boolean(facilities.error) || !facilityCode}>
          {busy ? "Đang lưu…" : "Lưu phân công"}
        </button>
      </div>
    </form>
  );
}

export default function StaffFacilityAssignmentPage() {
  return (
    <ResourcePage
      title="Gán nhân sự vào cơ sở"
      eyebrow="ADMIN / PHÂN CÔNG CƠ SỞ"
      description="Chọn nhân sự từ dữ liệu thật rồi gán cơ sở phụ trách và trạng thái hoạt động."
      load={loadStaff}
      searchPlaceholder="Tìm theo mã, tên, email hoặc cơ sở…"
      tableTitle="Danh sách nhân sự"
      exportName="staff-facility-assignments"
      columns={[
        ["id", "Mã người dùng"],
        ["name", "Họ tên"],
        ["email", "Email"],
        ["role", "Vai trò"],
        ["facilityCode", "Mã cơ sở"],
        ["status", "Trạng thái"],
      ]}
      filters={[
        { key: "role", label: "Vai trò", options: STAFF_ROLES },
        { key: "status", label: "Trạng thái" },
        { key: "facilityCode", label: "Cơ sở" },
      ]}
      renderDetail={(user, onSaved) => <AssignmentDetail user={user} onSaved={onSaved} />}
      detailTitle={(user) => `Phân công: ${user.name || user.username || user.id}`}
      metrics={(rows) => [
        { label: "Tổng nhân sự", value: rows.length, icon: "groups", tone: "blue" },
        { label: "Đã gán cơ sở", value: rows.filter((row) => row.facilityCode).length, icon: "domain", tone: "green" },
        { label: "Đang hoạt động", value: rows.filter((row) => row.status === "ACTIVE").length, icon: "check_circle", tone: "navy" },
      ]}
    />
  );
}
