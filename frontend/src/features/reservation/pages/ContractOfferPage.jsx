import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { reservationApi } from "../api/reservation.api";
import { billingApi } from "../../billing/api/billing.api";
export default function ContractOfferPage() {
    const { reservationId = "" } = useParams();
    const navigate = useNavigate();
    const { data, error, busy } = useRemote(() => reservationApi.contractOffer(reservationId), [reservationId]);
    const [accepted, setAccepted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    if (busy)
        return <main className="page-content"><p>Đang tải hồ sơ hợp đồng…</p></main>;
    if (error || !data)
        return <main className="page-content"><section className="card error" role="alert">{error || "Chưa có hồ sơ hợp đồng."}</section><Link to="/reservations/all/appointment">Về thẻ hẹn</Link></main>;
    const reservation = data.reservation;
    const contract = data.contract;
    const customer = data.customer;
    const facility = data.facility;
    const unit = data.unit;
    const offer = data;
    const alreadyAccepted = Boolean(reservation.contractTermsAcceptedAt || offer.acceptedAt);
    const terms = (() => { try {
        return JSON.parse(String(data.termsSnapshot || "{}"));
    }
    catch {
        return {};
    } })();
    const policies = (terms.policies && typeof terms.policies === "object" ? terms.policies : data.policies);
    const articles = Array.isArray(terms.articles) ? terms.articles : [];
    async function confirm() {
        setSaving(true);
        setSaveError("");
        try {
            if (!alreadyAccepted)
                await reservationApi.acceptTerms(reservationId, String(offer.termsVersion));
            const bills = await billingApi.invoices();
            const rent = bills.find((invoice) => invoice.reservationId === reservationId && invoice.invoiceType === "RENT");
            if (!rent?.id)
                throw new Error("Đã xác nhận điều khoản nhưng chưa tìm thấy hóa đơn tiền thuê.");
            navigate(`/invoices/${encodeURIComponent(String(rent.id))}/pay`, { replace: true });
        }
        catch (cause) {
            setSaveError(cause instanceof Error ? cause.message : "Không lưu được xác nhận hợp đồng.");
            setSaving(false);
        }
    }
    return <main className="page-content contract-offer-page">
    <header className="page-heading"><div><span className="eyebrow">HỒ SƠ THUÊ KHO · CHỜ KHÁCH XÁC NHẬN</span><h1>Đọc và xác nhận hợp đồng thuê</h1><p>Nhân viên đã xác minh bạn tại cơ sở. Kiểm tra thông tin và điều khoản trước khi thanh toán tiền thuê.</p></div></header>
    <div className="contract-offer-grid"><section className="card"><h2>Thông tin khách hàng và mặt bằng</h2><dl>
      <div><dt>Mã hợp đồng</dt><dd><strong>{display(contract?.id)}</strong> · Chờ thanh toán</dd></div>
      <div><dt>Khách hàng</dt><dd>{display(customer.name)}</dd></div><div><dt>Số điện thoại</dt><dd className="contract-identity-value">{display(customer.phone)}</dd></div><div><dt>Email</dt><dd>{display(customer.email)}</dd></div><div><dt>CCCD</dt><dd className="contract-identity-value">{display(customer.cccd || "Chưa cập nhật")}</dd></div>
      <div><dt>Mã đặt chỗ</dt><dd>{display(reservation.id)}</dd></div><div><dt>Cơ sở</dt><dd>{display(facility.name)} · {display(facility.code)}</dd></div>
      <div><dt>Địa chỉ</dt><dd>{display(facility.address)}, {display(facility.city)}</dd></div><div><dt>Kho</dt><dd>{display(unit.code)} · {display(unit.type)} · {display(unit.size)}</dd></div>
      <div><dt>Ngày bắt đầu thuê</dt><dd>{display(terms.startDate || reservation.startDate)}</dd></div><div><dt>Thời hạn</dt><dd>{display(terms.durationMonths || reservation.durationMonths)} tháng</dd></div>
      <div><dt>Tiền đặt cọc đã thanh toán</dt><dd>{money(terms.deposit || reservation.depositAmount)}</dd></div><div><dt>Tiền thuê kỳ đầu cần thanh toán</dt><dd><strong>{money(terms.monthlyRent || reservation.monthlyPriceSnapshot)}</strong></dd></div>
    </dl></section><aside className="card contract-terms"><h2>Hợp đồng thuê kho lưu trữ</h2><p>Mã hợp đồng: <strong>{display(contract?.id)}</strong></p><p>Phiên bản điều khoản: <strong>{display(data.termsVersion)}</strong></p>{alreadyAccepted && <p className="notice" role="status">Điều khoản đã được xác nhận. Tiếp tục tới hóa đơn thanh toán.</p>}{articles.map((article) => <section key={String(article.title)}><h3>{display(article.title)}</h3><ul>{(Array.isArray(article.items) ? article.items : []).map((item, index) => <li key={index}>{display(item)}</li>)}</ul></section>)}{!alreadyAccepted && <label className="terms-accept"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)}/> Tôi xác nhận đã đọc, đồng ý thông tin hợp đồng và các chính sách hiển thị.</label>}{saveError && <p className="error" role="alert">{saveError}</p>}<button type="button" disabled={(!accepted && !alreadyAccepted) || saving} onClick={confirm}>{saving ? "Đang mở hóa đơn…" : alreadyAccepted ? "Tới hóa đơn thanh toán" : "Xác nhận hợp đồng và tới thanh toán"}</button></aside></div>
  </main>;
}
