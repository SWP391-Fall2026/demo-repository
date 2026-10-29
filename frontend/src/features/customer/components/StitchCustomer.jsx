import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import storageIllustration from "../../../assets/images/landing/gallery.jpg";
import { referenceImages } from "../../../assets/images/stitch/reference-images";
import { PublicHeader } from "../../../app/layouts/PublicChrome";
import "./customer.css";
import "./customer-reference.css";

export function Icon({ children, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>;
}

export function CustomerBreadcrumb({ items = [] }) {
  return <nav className="stitch-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link>{items.map((item, index) => <span key={`${item.label}-${index}`}><Icon>chevron_right</Icon>{item.to ? <Link to={item.to}>{item.label}</Link> : <strong>{item.label}</strong>}</span>)}</nav>;
}

export function CustomerHeading({ title, description, action, icon }) {
  return <header className="stitch-page-heading"><div><h1>{icon && <Icon>{icon}</Icon>}{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}

export function CustomerEmpty({ icon = "inventory_2", title, description, action, error = false }) {
  return <section className={`stitch-empty ${error ? "is-error" : ""}`} role={error ? "alert" : undefined}><span className="stitch-empty-icon"><Icon>{icon}</Icon></span><h2>{title}</h2>{description && <p>{description}</p>}{action}</section>;
}

export function Status({ children, tone = "blue" }) {
  return <span className={`stitch-status ${tone}`}><i />{children}</span>;
}

export function UnitImage({ unit, className = "", title, screen, imageIndex = 1 }) {
  const fallback = referenceImages[screen]?.[imageIndex] || storageIllustration;
  return <div className={`stitch-unit-image ${className}`}><img src={unit?.imageUrl ? String(unit.imageUrl) : fallback} alt={unit?.imageUrl ? String(unit.imageAltText || title || `Kho ${unit.code || unit.unitCode || ""}`) : "Ảnh minh họa không gian kho lưu trữ"} />{!unit?.imageUrl && <span className="stitch-image-caption">Ảnh minh họa</span>}</div>;
}

export function dateText(value, time = false) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return time ? date.toLocaleString("vi-VN") : date.toLocaleDateString("vi-VN");
}

export const contractStatuses = { ACTIVE: "Đang thuê / Hiệu lực", EXPIRING_SOON: "Sắp hết hạn", OVERDUE: "Quá hạn", CHECKOUT_REQUESTED: "Đã yêu cầu trả kho", TERMINATED: "Đã kết thúc", PENDING_HANDOVER: "Chờ bàn giao", PENDING_PAYMENT: "Chờ thanh toán" };

export function CustomerSteps({ active = 1, steps = ["Chọn kho", "Đặt giữ chỗ", "Thanh toán tiền cọc", "Nhận bàn giao"] }) {
  return <ol className="sc-progress">{steps.map((label, index) => <li className={index + 1 === active ? "active" : index + 1 < active ? "done" : ""} key={label}><span>{index + 1 < active ? <Icon>check</Icon> : index + 1}</span><strong>{label}</strong></li>)}</ol>;
}

export function CustomerModal({ title, icon = "info", children, onClose }) {
  const ref = useRef(null);
  useEffect(() => { const previous = document.activeElement; ref.current?.showModal(); return () => { ref.current?.close(); previous?.focus?.(); }; }, []);
  return <dialog className="sc-modal" ref={ref} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="sc-modal-header"><span><Icon>{icon}</Icon></span><button type="button" onClick={onClose} aria-label="Đóng cửa sổ"><Icon>close</Icon></button></div><h2>{title}</h2>{children}</dialog>;
}

export function CustomerHelp({ title = "Cần hỗ trợ từ cơ sở?", description = "Đội ngũ hỗ trợ sẵn sàng giải đáp thông tin thuê kho và hướng dẫn thủ tục tại cơ sở." }) {
  return <section className="sc-help"><Icon>support_agent</Icon><h3>{title}</h3><p>{description}</p><a href="tel:19006868"><Icon>call</Icon>1900 6868</a><Link to="/support">Trung tâm hỗ trợ <Icon>arrow_forward</Icon></Link></section>;
}

export function AuthHeader({ navigationState }) {
  return <PublicHeader auth navigationState={navigationState} />;
}
