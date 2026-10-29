import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./office.css";
import "./management-stitch.css";

export function OfficeIcon({ children }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {children}
    </span>
  );
}

export function OfficeHeading({
  title,
  description,
  eyebrow = "KHO GỌN / QUẢN LÝ VẬN HÀNH",
  children,
}) {
  return (
    <header className="office-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="office-actions">{children}</div>
    </header>
  );
}

export function OfficeMetrics({ items }) {
  return (
    <section className="office-metrics">
      {items.map(
        ({ label, value, icon = "monitoring", note, tone = "blue" }) => (
          <article className="office-metric" key={label}>
            <div>
              <span>{label}</span>
              <i className={tone}>
                <OfficeIcon>{icon}</OfficeIcon>
              </i>
            </div>
            <strong>{value}</strong>
            {note && <small>{note}</small>}
          </article>
        ),
      )}
    </section>
  );
}

export function OfficeState({
  busy,
  error,
  title,
  children,
  onRetry,
  icon = "inventory_2",
}) {
  return (
    <section
      className={`office-state ${error ? "is-error" : ""}`}
      role={error ? "alert" : busy ? "status" : undefined}
      aria-live="polite"
    >
      <span className="office-state-symbol">
        <OfficeIcon>
          {busy ? "progress_activity" : error ? "cloud_off" : icon}
        </OfficeIcon>
      </span>
      <h2>
        {busy
          ? "Đang tải dữ liệu…"
          : error
            ? "Không thể tải dữ liệu"
            : title || "Chưa có dữ liệu"}
      </h2>
      <p>
        {error || children || "Dữ liệu sẽ xuất hiện khi có bản ghi phù hợp."}
      </p>
      {onRetry && (
        <button className="secondary" onClick={onRetry}>
          <OfficeIcon>refresh</OfficeIcon>Thử lại
        </button>
      )}
    </section>
  );
}

export function OfficeDetailPage({ title, eyebrow, onBack, children }) {
  return (
    <div className="office-page office-detail-page">
      <nav className="office-detail-breadcrumb">
        <button type="button" onClick={onBack}>
          <OfficeIcon>arrow_back</OfficeIcon>Quay lại danh sách
        </button>
        <OfficeIcon>chevron_right</OfficeIcon>
        <span>{title}</span>
      </nav>
      <OfficeHeading
        title={title}
        eyebrow={eyebrow}
        description="Tra cứu thông tin chi tiết và các tác vụ trong phạm vi được phân quyền."
      >
        <button
          type="button"
          className="secondary"
          onClick={() => window.print()}
        >
          <OfficeIcon>print</OfficeIcon>In hồ sơ
        </button>
      </OfficeHeading>
      {children}
    </div>
  );
}

export function OfficeGovernance({
  title = "Phạm vi thẩm quyền",
  children,
  icon = "gavel",
}) {
  return (
    <aside className="office-governance">
      <span className="office-governance-icon">
        <OfficeIcon>{icon}</OfficeIcon>
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </aside>
  );
}

export function OfficeDialog({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="office-dialog office-page"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <header>
        <div>
          <span className="eyebrow">KHO GỌN / THÔNG TIN CHI TIẾT</span>
          <h2>{title}</h2>
        </div>
        <button
          className="office-icon-button"
          aria-label="Đóng"
          onClick={onClose}
        >
          <OfficeIcon>close</OfficeIcon>
        </button>
      </header>
      <div className="office-dialog-body">{children}</div>
    </dialog>
  );
}

export function OfficeLinks({ items }) {
  return (
    <div className="office-quick-links">
      {items.map(({ to, icon, title, description }) => (
        <Link key={to} to={to}>
          <span>
            <OfficeIcon>{icon}</OfficeIcon>
          </span>
          <div>
            <strong>{title}</strong>
            <p>{description}</p>
          </div>
          <OfficeIcon>arrow_forward</OfficeIcon>
        </Link>
      ))}
    </div>
  );
}

export function downloadRows(rows, columns, name = "storage-export") {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const safe = (value) =>
    /^[=+\-@\t\r]/.test(String(value ?? "")) ? `'${value}` : value;
  const contents = [
    columns.map(([, label]) => quote(label)).join(","),
    ...rows.map((row) =>
      columns
        .map(([key]) =>
          quote(
            safe(
              typeof row[key] === "object"
                ? JSON.stringify(row[key])
                : row[key],
            ),
          ),
        )
        .join(","),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
