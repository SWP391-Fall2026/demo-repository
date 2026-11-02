import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { identityApi } from "../api/identity.api";

const names = { CUSTOMER: "Khách hàng", STAFF: "Nhân viên", FMANAGER: "Quản lý cơ sở", OPS_MGR: "Điều hành", ADMIN: "Quản trị" };
const modules = { FACILITY: "Cơ sở và kho", RESERVATION: "Đặt chỗ", RENTAL: "Hợp đồng và truy cập", BILLING: "Thanh toán và hoàn tiền", SUPPORT: "Hỗ trợ", WORKFORCE: "Công việc", POLICY: "Chính sách", REPORTING: "Báo cáo", AUDIT: "Nhật ký" };

export function AccessPolicyEditor() {
  const remote = useRemote(identityApi.accessPolicy);
  const [role, setRole] = useState("STAFF");
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function toggle(row) {
    if (working) return;
    setWorking(row.permission); setError(""); setMessage("");
    try {
      await identityApi.updateAccessPolicy({ role, permission: row.permission, enabled: !row.enabled });
      setMessage("Đã lưu quyền truy cập và ghi nhật ký thay đổi.");
      remote.reload();
    } catch (cause) { setError(cause.message); }
    finally { setWorking(""); }
  }
  return <section className="card">
    <h2>Cấu hình quyền truy cập</h2>
    <p>Bật hoặc tắt quyền xem, cập nhật cho từng vai trò. Nhân sự chỉ truy cập cơ sở được gán; khách chỉ truy cập dữ liệu của mình. Quyền duyệt và phân tách trách nhiệm vẫn tuân theo nghiệp vụ.</p>
    <label>Vai trò<select value={role} onChange={e => { setRole(e.target.value); setMessage(""); }} disabled={!!working}>{Object.entries(names).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
    {remote.error && <p role="alert">{remote.error}</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {remote.busy ? <p>Đang tải quyền…</p> : <div className="table-wrap"><table><thead><tr><th>Phân hệ</th><th>Thao tác</th><th>Trạng thái</th><th>Thay đổi</th></tr></thead><tbody>{(remote.data?.[role] || []).map(row => {
      const [module, action] = row.permission.split(".");
      return <tr key={row.permission}><td>{modules[module] || module}</td><td>{action === "READ" ? "Xem" : "Cập nhật"}</td><td>{row.enabled ? "Đang bật" : "Đã tắt"}</td><td><button type="button" className="secondary" disabled={!!working} onClick={() => toggle(row)}>{working === row.permission ? "Đang lưu…" : row.enabled ? "Tắt quyền" : "Bật quyền"}</button></td></tr>;
    })}</tbody></table></div>}
    <p>Quyền quản lý tài khoản và cấu hình phân quyền của Admin luôn giữ để tránh khóa quản trị.</p>
  </section>;
}
