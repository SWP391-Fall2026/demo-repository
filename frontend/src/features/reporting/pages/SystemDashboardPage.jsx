import { Link } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";
import { reportingApi } from "../api/reporting.api";
import { identityApi } from "../../identity/api/identity.api";
import { auditApi } from "../../audit/api/audit.api";
import {
  OfficeHeading,
  OfficeMetrics,
  OfficeState,
  OfficeIcon,
  OfficeGovernance,
} from "../../../shared/ui/office/OfficeUi";
import "../../../shared/ui/office/management-stitch.css";
async function load() {
  const [overview, accounts, activity, matrix] = await Promise.all([
    reportingApi.system(),
    identityApi.users(),
    auditApi.list(),
    identityApi.roles(),
  ]);
  return {
    ...overview,
    accounts: Array.isArray(accounts) ? accounts : [],
    activity: Array.isArray(activity) ? activity : [],
    matrix: matrix || {},
  };
}
const names = {
  CUSTOMER: "Khách hàng (Customer)",
  STAFF: "Nhân viên cơ sở (Facility Staff)",
  FMANAGER: "Quản lý cơ sở (Facility Manager)",
  OPS_MGR: "Ban Điều Hành Kinh Doanh (BOM)",
  ADMIN: "Quản trị viên hệ thống (System Administrator)",
};
export default function SystemDashboardPage() {
  const remote = useRemote(load);
  const d = remote.data;
  const groups = Object.entries(d?.matrix || {}).map(([role, description]) => ({
    role,
    description,
    users: (d?.accounts || []).filter((user) => user.role === role),
  }));
  return (
    <div className="office-page office-system-overview">
      <OfficeHeading
        title="System Overview"
        eyebrow="QUẢN TRỊ HỆ THỐNG / TỔNG QUAN"
        description="Tổng quan quản trị hệ thống."
      >
        <button className="secondary" onClick={remote.reload}>
          <OfficeIcon>sync</OfficeIcon>Làm mới trạng thái
        </button>
      </OfficeHeading>
      {remote.error ? (
        <OfficeState error={remote.error} onRetry={remote.reload} />
      ) : remote.busy ? (
        <OfficeState busy />
      ) : !d ? (
        <OfficeState title="Chưa có dữ liệu hệ thống" />
      ) : (
        <>
          <OfficeMetrics
            items={[
              {
                label: "Tài khoản quản lý",
                value: display(d.users),
                icon: "groups",
                note: `${d.accounts.filter((user) => user.status === "ACTIVE").length} hoạt động`,
              },
              {
                label: "Phân quyền RBAC",
                value: groups.length,
                icon: "badge",
                tone: "navy",
                note: "Vai trò & nhóm quyền",
              },
              {
                label: "Cơ sở hệ thống",
                value: display(d.facilities),
                icon: "domain",
                tone: "teal",
                note: "Mạng lưới cơ sở",
              },
              {
                label: "Sự kiện kiểm toán",
                value: d.activity.length,
                icon: "verified",
                tone: "amber",
                note: "Bản ghi nhật ký",
              },
            ]}
          />
          <section className="card office-role-directory">
            <header>
              <div>
                <h2>Phân bổ tài khoản &amp; vai trò người dùng</h2>
                <p>User &amp; Role Directory Overview</p>
              </div>
              <Link to="/admin/users">
                Quản lý tài khoản chi tiết{" "}
                <OfficeIcon>arrow_forward</OfficeIcon>
              </Link>
            </header>
            <div>
              {groups.map((group, index) => (
                <article key={group.role}>
                  <div>
                    <span className="office-role-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3>{names[group.role] || group.role}</h3>
                    <span className="badge">{group.role}</span>
                  </div>
                  <strong>{group.users.length} tài khoản</strong>
                  <small>
                    {
                      group.users.filter((user) => user.status === "ACTIVE")
                        .length
                    }{" "}
                    hoạt động
                  </small>
                  <p>Phạm vi quyền: {display(group.description)}</p>
                </article>
              ))}
            </div>
          </section>
          <div className="office-system-columns">
            <section className="card office-system-config">
              <h2>
                <OfficeIcon>settings_system_daydream</OfficeIcon>Trạng thái đồng
                bộ cấu hình
              </h2>
              <dl>
                <div>
                  <dt>Danh mục tài khoản</dt>
                  <dd>{d.accounts.length} tài khoản đã tải</dd>
                </div>
                <div>
                  <dt>Ma trận phân quyền</dt>
                  <dd>{groups.length} vai trò</dd>
                </div>
                <div>
                  <dt>Mạng lưới cơ sở</dt>
                  <dd>{display(d.facilities)} cơ sở</dd>
                </div>
                <div>
                  <dt>Nhật ký kiểm toán</dt>
                  <dd>{d.activity.length} bản ghi</dd>
                </div>
              </dl>
              <Link className="office-row-link" to="/admin/roles">
                Xem vai trò &amp; quyền <OfficeIcon>arrow_forward</OfficeIcon>
              </Link>
            </section>
            <section className="card office-audit-timeline">
              <header>
                <h2>
                  <OfficeIcon>history_edu</OfficeIcon>Nhật ký kiểm toán gần nhất
                </h2>
                <Link to="/admin/activity">Xem tất cả</Link>
              </header>
              {!d.activity.length ? (
                <OfficeState title="Chưa có dữ liệu nhật ký" />
              ) : (
                <ol>
                  {d.activity.slice(0, 5).map((row, index) => (
                    <li key={row.id || index}>
                      <span className="office-timeline-dot" />
                      <small>{display(row.timeStr || row.createdAt)}</small>
                      <strong>{display(row.action)}</strong>
                      <p>
                        {display(row.userName)} · {display(row.entityId)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
          <OfficeGovernance title="Ranh giới Thẩm quyền Quản trị viên & Tuân thủ Quản trị">
            Quản trị viên quản lý định danh, vai trò và nhật ký kiểm toán.
            Nghiệp vụ đặt kho, thanh toán và vận hành thực địa thuộc vai trò
            chuyên trách theo nguyên tắc phân tách trách nhiệm (SoD).
          </OfficeGovernance>
        </>
      )}
    </div>
  );
}
