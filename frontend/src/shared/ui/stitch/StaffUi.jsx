import { Link } from "react-router-dom";
import "./staff-ui.css";

export function StaffIcon({ name, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined staff-icon ${className}`}
    >
      {name}
    </span>
  );
}
export function StaffPage({ children, className = "" }) {
  return <div className={`stitch-staff-page ${className}`}>{children}</div>;
}
export function StaffShell({ children, className = "" }) {
  return (
    <div className="stitch-staff-shell">
      <StaffPage className={className}>{children}</StaffPage>
    </div>
  );
}
export function StaffHeading({
  title,
  description,
  section = "Nghiệp vụ cơ sở",
  actions,
  children,
}) {
  const crumbs = section.split("/").map((item) => item.trim());
  return (
    <header className="staff-page-heading">
      <div className="staff-heading-content">
        <nav className="staff-breadcrumb" aria-label="Đường dẫn">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb}-${index}`}>
              {index > 0 && <StaffIcon name="chevron_right" />}
              {crumb}
            </span>
          ))}
          <StaffIcon name="chevron_right" />
          <span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
      {actions && <div className="staff-heading-actions">{actions}</div>}
    </header>
  );
}
export function StaffSection({
  title,
  description,
  icon,
  meta,
  children,
  className = "",
}) {
  return (
    <section className={`staff-panel ${className}`}>
      {title && (
        <header className="staff-panel-heading">
          <div>
            <h2>
              {icon && <StaffIcon name={icon} />}
              {title}
            </h2>
            {description && <p>{description}</p>}
          </div>
          {meta && <span>{meta}</span>}
        </header>
      )}
      <div className="staff-panel-body">{children}</div>
    </section>
  );
}
export function StaffMetric({
  label,
  value,
  icon,
  tone = "blue",
  detail,
  kicker,
  unit,
  to,
  action,
}) {
  return (
    <article className={`staff-metric staff-tone-${tone}`}>
      <div>
        {kicker && <small className="staff-metric-kicker">{kicker}</small>}
        <span>{label}</span>
        <div className="staff-metric-value">
          <strong>{value}</strong>
          {unit && <span>{unit}</span>}
        </div>
        {detail && <small>{detail}</small>}
        {to && (
          <Link className="staff-link" to={to}>
            {action || "Xem chi tiết"} <StaffIcon name="arrow_forward" />
          </Link>
        )}
      </div>
      <span className="staff-metric-icon">
        <StaffIcon name={icon} />
      </span>
    </article>
  );
}
const statusLabels = {
  PENDING: "Chờ xử lý",
  PENDING_PAYMENT: "Chờ thanh toán",
  IN_PROGRESS: "Đang xử lý",
  COMPLETED: "Hoàn tất",
  OPEN: "Mới tiếp nhận",
  RESOLVED: "Đã giải quyết",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  RESERVED: "Đã xác nhận giữ chỗ",
  CHECKED_IN: "Đã check-in",
  AVAILABLE: "Còn trống",
  OCCUPIED: "Đang thuê",
  CLEANING: "Đang vệ sinh",
  MAINTENANCE: "Bảo trì",
  READY_FOR_REVIEW: "Chờ duyệt sẵn sàng",
  ACTIVE: "Đang hiệu lực",
  EXPIRING_SOON: "Sắp hết hạn",
  OVERDUE: "Quá hạn",
  TERMINATED: "Đã trả kho",
  HANDOVER_PENDING: "Chờ khách xác nhận",
  PENDING_HANDOVER: "Chờ bàn giao",
  PAID: "Đã thanh toán",
  CLEAN: "Sử dụng bình thường",
  ISSUE: "Cần kiểm tra",
  UNPAID: "Chưa thanh toán",
};
export function StaffStatus({ value, label }) {
  const text = String(value || "").toUpperCase();
  const tone = [
    "COMPLETED",
    "RESOLVED",
    "AVAILABLE",
    "ACTIVE",
    "PAID",
    "CLEAN",
    "CHECKED_IN",
    "TERMINATED",
  ].includes(text)
    ? "green"
    : ["CANCELLED", "EXPIRED", "ISSUE", "MAINTENANCE", "OVERDUE"].includes(text)
      ? "red"
      : [
            "IN_PROGRESS",
            "OCCUPIED",
            "HANDOVER_PENDING",
            "PENDING_HANDOVER",
            "RESERVED",
          ].includes(text)
        ? "blue"
        : "amber";
  return (
    <span className={`staff-status staff-status-${tone}`}>
      <i />
      {label || statusLabels[text] || value || "Chưa có"}
    </span>
  );
}
export function StaffState({
  loading,
  error,
  title = "Chưa có dữ liệu",
  description,
  onRetry,
  icon = "inventory_2",
  children,
}) {
  return (
    <div
      className={`staff-state ${error ? "staff-state-error" : ""}`}
      role={error ? "alert" : loading ? "status" : undefined}
    >
      <span className="staff-state-icon">
        <StaffIcon name={loading ? "sync" : error ? "warning" : icon} />
      </span>
      <h3>
        {loading
          ? "Đang tải dữ liệu…"
          : error
            ? "Không thể tải dữ liệu"
            : title}
      </h3>
      <p>{error || description}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          <StaffIcon name="refresh" />
          {error ? "Thử lại" : "Làm mới danh sách"}
        </button>
      )}
      {children}
    </div>
  );
}
export function StaffNotice({ children, error = false }) {
  if (!children) return null;
  return (
    <div
      className={`staff-notice ${error ? "staff-notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      <StaffIcon name={error ? "error" : "check_circle"} />
      <div>{children}</div>
    </div>
  );
}
export function StaffFacts({ items }) {
  return (
    <dl className="staff-facts">
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value == null || value === "" ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function StaffSteps({ steps, current = 0 }) {
  return (
    <ol className="staff-steps">
      {steps.map((step, index) => (
        <li
          className={
            index === current ? "current" : index < current ? "complete" : ""
          }
          key={step}
        >
          <span>
            {index < current ? (
              <StaffIcon name="check" />
            ) : (
              String(index + 1).padStart(2, "0")
            )}
          </span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}
export function StaffAvatar({ name = "", children }) {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className="staff-cell-title">
      <span className="staff-person-avatar">
        {initials || <StaffIcon name="person" />}
      </span>
      <div>
        <strong>{name || "Chưa có thông tin khách"}</strong>
        {children}
      </div>
    </div>
  );
}
export function StaffPager({
  total,
  page,
  pageSize = 8,
  onChange,
  noun = "kết quả",
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <footer className="staff-table-footer">
      <span>
        Hiển thị{" "}
        <strong>
          {total ? (page - 1) * pageSize + 1 : 0} -{" "}
          {Math.min(page * pageSize, total)}
        </strong>{" "}
        trên <strong>{total}</strong> {noun}
      </span>
      <div>
        <button
          type="button"
          className="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
        >
          <StaffIcon name="chevron_left" />
        </button>
        <span className="staff-current-page">{page}</span>
        <button
          type="button"
          className="secondary"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
        >
          <StaffIcon name="chevron_right" />
        </button>
      </div>
    </footer>
  );
}
export function StaffOperations({
  title = "Quy chuẩn nghiệp vụ tại cơ sở",
  steps,
  facility,
}) {
  return (
    <div className="staff-operations-grid">
      <section className="staff-sop-card">
        <header>
          <StaffIcon name="menu_book" />
          <strong>{title}</strong>
        </header>
        <div className="staff-guidance">
          {steps.map(([icon, heading, text], index) => (
            <article key={heading}>
              <span className="staff-guidance-number">{index + 1}</span>
              <div>
                <h3>{heading}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="staff-connection-card">
        <span className="staff-eyebrow">Phạm vi vận hành</span>
        <h3>
          <StaffIcon name="domain" />
          {facility || "Cơ sở được phân công"}
        </h3>
        <p>
          Thao tác được ghi nhận trong hồ sơ nghiệp vụ và giới hạn theo quyền
          của nhân viên.
        </p>
        <span className="staff-connection-note">
          <StaffIcon name="sensors" />
          Chưa có dữ liệu cảm biến trực tiếp
        </span>
      </aside>
    </div>
  );
}
export function staffDate(value, withTime = false) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        ...(withTime ? { timeStyle: "short" } : {}),
      }).format(parsed);
}
