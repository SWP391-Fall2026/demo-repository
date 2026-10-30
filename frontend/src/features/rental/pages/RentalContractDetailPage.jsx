import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";
import { Icon, UnitImage, CustomerBreadcrumb, CustomerHeading, CustomerEmpty, Status, contractStatuses } from "../../customer/components/StitchCustomer";
import "../../customer/components/customer.css";
function formattedDate(value) {
    if (!value)
        return "—";
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? display(value) : parsed.toLocaleDateString("vi-VN");
}
const policyNames = {
    depositMonths: "Tiền cọc đảm bảo (tháng thuê)",
    cleaningFee: "Phí vệ sinh tối đa",
    overdueDailyFee: "Phí quá hạn mỗi ngày",
    newLockFee: "Phí cấp khóa mới",
    "discount.3": "Ưu đãi thuê 3 tháng",
    "discount.6": "Ưu đãi thuê 6 tháng",
    "discount.12": "Ưu đãi thuê 12 tháng",
    "price.S": "Giá kho loại S / tháng",
    "price.M": "Giá kho loại M / tháng",
    "price.L": "Giá kho loại L / tháng",
    "price.CLIMATE": "Giá kho điều hòa / tháng",
};
function policyValue(key, value) {
    if (key.startsWith("discount."))
        return `${(Number(value) * 100).toLocaleString("vi-VN")}%`;
    if (key === "depositMonths")
        return `${value} tháng`;
    return money(value);
}
export default function RentalContractDetailPage() {
    const { contractId = "" } = useParams();
    const { data, error, busy } = useRemote(() => rentalApi.detail(contractId), [contractId]);
    const [pinVisible, setPinVisible] = useState(false);
    const [facilityPinVisible, setFacilityPinVisible] = useState(false);
    if (busy)
        return <main className="page-content stitch-customer"><p>Đang tải chi tiết hợp đồng…</p></main>;
    if (error || !data)
        return <main className="page-content stitch-customer"><section className="card error" role="alert">{error || "Không tìm thấy hợp đồng."}</section><Link to="/rentals">Quay lại kho đang thuê</Link></main>;
    const contract = data.contract;
    const customer = data.customer;
    const facility = data.facility;
    const unit = data.unit;
    const handover = data.handover;
    const invoices = Array.isArray(data.invoices) ? data.invoices : [];
    const acceptedTerms = (() => { try {
        return JSON.parse(String(data.acceptedTermsSnapshot || "{}"));
    }
    catch {
        return {};
    } })();
    const articles = Array.isArray(acceptedTerms.articles) ? acceptedTerms.articles : [];
    const policies = data.policies && typeof data.policies === "object" ? data.policies : {};
    if (!contract)
        return <main className="page-content stitch-customer"><section className="card error" role="alert">Dữ liệu hợp đồng không hợp lệ.</section></main>;
    return <main className="page-content stitch-customer contract-detail-page">
    <CustomerBreadcrumb items={[{ label: "Kho đang thuê", to: "/rentals" }, { label: String(contract.unitCode) }]} /><div className="contract-breadcrumb" hidden><Link to="/rentals">Kho đang thuê</Link> › Chi tiết hợp đồng <strong>{display(contract.unitCode)}</strong></div>
    <header className="contract-detail-heading"><div><h1>Chi tiết kho đang thuê <span className="badge success">{contractStatuses[contract.status] || display(contract.status)}</span></h1><p>Thông tin hợp đồng, kho lưu trữ và quyền truy cập của bạn.</p></div><div className="facility-scope"><small>KHU VỰC KIỂM SOÁT</small><strong>{display(facility?.name || contract.facilityCode)} · {display(unit?.floor ? `Tầng ${unit.floor}` : "")}</strong></div></header>

    <div className="sc-contract-toolbar"><Link className="button" to={`/rentals/renew?contractId=${encodeURIComponent(contract.id)}`}><Icon>autorenew</Icon>Gia hạn thuê</Link><Link className="button secondary" to={`/rentals/return?contractId=${encodeURIComponent(contract.id)}`}><Icon>assignment_return</Icon>Yêu cầu trả kho</Link><Link className="button secondary" to="/support?view=new"><Icon>support_agent</Icon>Yêu cầu hỗ trợ</Link></div><div className="contract-detail-grid">
      <div className="contract-detail-main">
        <section className="contract-panel">
          <header><h2>Thông tin mặt bằng kho lưu trữ</h2><span>{display(contract.unitCode)}</span></header>
          <UnitImage unit={unit} className="contract-unit-visual" screen="scr_07_chi_ti_t_kho_ang_thu_tra_c_u_pin"/>
          <div className="contract-info-grid">
            <div><small>CƠ SỞ VẬN HÀNH</small><strong>{display(facility?.name || contract.facilityCode)}</strong><span>{display(facility?.address)}{facility?.city ? `, ${display(facility.city)}` : ""}</span></div>
            <div><small>VỊ TRÍ PHÒNG KHO</small><strong>{display(contract.unitCode)}</strong><span>{display(unit?.floor ? `Tầng ${unit.floor}` : facility?.code)}</span></div>
            <div><small>PHÂN HẠNG KHO</small><strong>{display(unit?.type)}</strong><span>{display(unit?.sizeDesc || `${display(unit?.sizeSqm)} m²`)}</span></div>
            <div><small>DIỆN TÍCH &amp; TRẠNG THÁI</small><strong>{display(unit?.sizeSqm)} m²</strong><span>{display(contract.status)}</span></div>
          </div>
          <div className="contract-facility-note"><span>Địa chỉ</span><strong>{display(facility?.address)}, {display(facility?.city)}</strong><span>Hotline cơ sở: {display(facility?.hotline)}</span></div>
        </section>

        <section className="contract-panel terms-panel">
          <header><h2>Thời hạn &amp; hồ sơ hợp đồng</h2><span>Hồ sơ khách hàng: {display(customer?.name)}</span></header>
          <div className="contract-info-grid">
            <div><small>MÃ HỢP ĐỒNG</small><strong>{display(contract.id)}</strong><span>Ký số điện tử trên hệ thống</span></div>
            <div><small>CHU KỲ THUÊ</small><strong>{display(contract.durationMonths)} tháng</strong><span>Trạng thái: {display(contract.status)}</span></div>
            <div><small>GIÁ THUÊ / THÁNG</small><strong className="blue-value">{money(contract.monthlyFee)}</strong><span>Đã chốt trong hợp đồng</span></div>
            <div><small>TIỀN CỌC ĐẢM BẢO</small><strong>{money(contract.depositFee)}</strong><span>Đối soát theo chính sách thuê</span></div>
          </div>
          <div className="contract-date-row"><span>Ngày hiệu lực<strong>{formattedDate(contract.startAt || contract.startDate)}</strong></span><span>Ngày kết thúc<strong>{formattedDate(contract.endAt || contract.endDate)}</strong></span><span>Biên bản bàn giao<strong>{handover ? formattedDate(handover.handoverDate) : "Chưa có dữ liệu"}</strong></span></div>
        </section>

        <section className="contract-panel terms-panel">
          <header><h2>Điều khoản hợp đồng đã xác nhận</h2><span>{display(data.acceptedTermsVersion)}</span></header>
          {articles.length ? articles.map((article) => <section className="contract-article" key={String(article.title)}><h3>{display(article.title)}</h3><ul>{(Array.isArray(article.items) ? article.items : []).map((item, index) => <li key={index}>{display(item)}</li>)}</ul></section>) : <p>Hợp đồng được điều chỉnh theo chính sách cơ sở đã xác nhận.</p>}
        </section>

        <section className="contract-panel">
          <header><h2>Thông tin cá nhân &amp; bàn giao</h2><span>ĐÃ XÁC THỰC</span></header>
          <div className="contract-info-grid">
            <div><small>KHÁCH HÀNG</small><strong>{display(customer?.name)}</strong><span>Điện thoại: {display(customer?.phone)}</span></div>
            <div><small>EMAIL TÀI KHOẢN</small><strong>{display(customer?.email)}</strong></div>
            <div className="wide-info"><small>HIỆN TRẠNG KHO KHI BÀN GIAO</small><strong>{handover ? display(handover.unitConditionNotes) : "Chưa có biên bản bàn giao"}</strong><span>Nhân viên xác nhận bàn giao: {handover?.status === "COMPLETED" ? "Đã xác nhận" : "Chưa xác nhận"}</span></div>
          </div>
        </section>

        <section className="contract-panel">
          <header><h2>Hóa đơn hợp đồng &amp; thanh toán</h2><Link to="/invoices/all/pay">Mở thanh toán</Link></header>
          {!invoices.length ? <p>Chưa có hóa đơn liên quan.</p> : <div className="contract-invoice-list">{invoices.map((invoice) => <div key={String(invoice.id)}><span><strong>{invoice.invoiceType === "DEPOSIT" ? "Hóa đơn đặt cọc" : invoice.invoiceType === "RENT" ? "Hóa đơn thuê" : `Hóa đơn ${display(invoice.invoiceType)}`}</strong><small>{display(invoice.id)} · Hạn {formattedDate(invoice.dueAt)}</small></span><strong>{money(invoice.amount)}</strong><span className={`badge ${invoice.status === "PAID" ? "success" : invoice.status === "PENDING" ? "pending" : "danger"}`}>{invoice.status === "PAID" ? "Đã thanh toán" : invoice.status === "PENDING" ? "Chưa thanh toán" : "Đã hủy"}</span></div>)}</div>}
        </section>
      </div>

      <aside className="contract-security-column">
        <section className="stitch-rental-command-card"><Icon>encrypted</Icon><h2>Quản lý truy cập kho</h2><p>Tra cứu PIN và kiểm tra quyền truy cập theo hợp đồng hiện tại.</p><Link className="button" to="/rentals/access">Nhập PIN truy cập <Icon>arrow_forward</Icon></Link></section>
        <section className="pin-panel"><header><span className="pin-shield"><Icon>apartment</Icon></span><div><h2>Mã PIN cơ sở</h2><small>CỔNG RA VÀO CƠ SỞ</small></div></header><p>Mã dùng cho cửa vào cơ sở {display(facility?.name || contract.facilityCode)}.</p><div className="pin-code-box"><small>MÃ PIN CỬA CƠ SỞ</small><strong>{facilityPinVisible ? display(facility?.pinCode) : "••••••"}</strong><span>{facility?.pinCode ? "ĐÃ CẤP PIN" : "CHƯA CẤP PIN"}</span></div><button type="button" className="pin-toggle" onClick={() => setFacilityPinVisible((visible) => !visible)} disabled={!facility?.pinCode}>{facilityPinVisible ? "Ẩn mã PIN" : "Hiện mã PIN"}</button></section>
        <section className="pin-panel"><header><span className="pin-shield">PIN</span><div><h2>Tra cứu mã PIN</h2><small>BẢO MẬT</small></div></header><p>Mã PIN này dùng để xác thực quyền truy cập kho {display(contract.unitCode)}.</p><div className="pin-code-box"><small>MÃ PIN CỦA KHO</small><strong>{pinVisible ? display(contract.pinCode) : "••••••"}</strong><span>{contract.pinCode ? "ĐÃ XÁC THỰC" : "CHƯA CẤP PIN"}</span></div><button type="button" className="pin-toggle" onClick={() => setPinVisible((visible) => !visible)} disabled={!contract.pinCode}>{pinVisible ? "Ẩn mã PIN" : "Hiện mã PIN"}</button><p className="pin-security-note">Không chia sẻ PIN. Hệ thống lưu lại các lượt xác thực ra/vào.</p></section>
        <section className="policy-panel"><h2>Quy định &amp; chính sách</h2><p>Áp dụng theo chính sách có hiệu lực của cơ sở và hợp đồng.</p><dl>{Object.entries(policies).filter(([key]) => policyNames[key]).map(([key, value]) => <div key={key}><dt>{policyNames[key]}</dt><dd>{policyValue(key, value)}</dd></div>)}</dl><p className="policy-warning">Phí quá hạn hoặc phí phát sinh được tính theo quy định hợp đồng và hiển thị thành hóa đơn riêng.</p></section>
        <Link className="button secondary contract-back-link" to="/rentals">← Quay lại kho đang thuê</Link>
      </aside>
    </div>
  </main>;
}
