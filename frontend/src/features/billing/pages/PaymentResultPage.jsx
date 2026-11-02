import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { billingApi } from "../api/billing.api";
import { reservationApi } from "../../reservation/api/reservation.api";
import { rentalApi } from "../../rental/api/rental.api";
import { display, money } from "../../../shared/lib/format";
import { CustomerBreadcrumb, Icon, UnitImage, dateText } from "../../customer/components/StitchCustomer";
export default function PaymentResultPage() {
    const [params] = useSearchParams();
    const ref = params.get("paymentRef") || "";
    const [state, setState] = useState("VERIFYING");
    const [message, setMessage] = useState("Đang xác minh giao dịch với hệ thống thanh toán.");
    const [payment, setPayment] = useState(null);
    const [reservation, setReservation] = useState(null);
    const [contract, setContract] = useState(null);
    const [invoice, setInvoice] = useState(null);
    useEffect(() => {
        if (!ref || params.get("status") === "failed") {
            setState("FAILED");
            setMessage("Giao dịch chưa được xác nhận thành công.");
            return;
        }
        let stopped = false;
        let attempts = 0;
        let timer;
        const verify = async () => {
            try {
                const payments = await billingApi.payments();
                if (stopped) return;
                const found = payments.find((item) => item.transactionCode === ref);
                if (found)
                    setPayment(found);
                if (found?.status === "PAID") {
                    let relatedContract = null;
                    if (found.contractId || found.invoiceType !== "DEPOSIT" && found.reservationId) {
                        try {
                            const rows = await rentalApi.list();
                            relatedContract = rows.find((item) => item.id === found.contractId || Boolean(found.reservationId) && item.reservationId === found.reservationId) || null;
                            if (!stopped) setContract(relatedContract);
                        }
                        catch { /* Keep receipt visible if contract lookup needs retry. */ }
                    }
                    const reservationId = found.reservationId || relatedContract?.reservationId;
                    if (reservationId) {
                        try {
                            const row = await reservationApi.get(String(reservationId));
                            if (!stopped) setReservation(row);
                        }
                        catch { /* Receipt remains usable without reservation detail. */ }
                    }
                    try {
                        const rows = await billingApi.invoices();
                        if (!stopped) setInvoice(rows.find((item) => item.id === found.invoiceId) || null);
                    }
                    catch { /* Payment remains the source of truth for settlement. */ }
                    if (stopped) return;
                    setState("PAID");
                    setMessage(found.invoiceType === "DEPOSIT" ? "Đơn đặt cọc của bạn đã được xác nhận." : found.invoiceType === "RENEW" ? "Hợp đồng đã được gia hạn và cập nhật." : found.invoiceType === "EXTRA" ? "Hóa đơn phụ phí đã được xác nhận thanh toán." : "Hóa đơn thuê của bạn đã được xác nhận.");
                    return;
                }
                if (found?.status === "FAILED") {
                    setState("FAILED");
                    setMessage("Giao dịch bị từ chối. Hóa đơn vẫn có thể thanh toán lại.");
                    return;
                }
            }
            catch { /* Retry while gateway confirmation is arriving. */ }
            if (stopped)
                return;
            attempts += 1;
            if (attempts >= 30) {
                setState("PENDING");
                setMessage("Chưa nhận được xác nhận cuối cùng. Kiểm tra lại hóa đơn trước khi thanh toán lần nữa.");
                return;
            }
            timer = window.setTimeout(verify, 3000);
        };
        void verify();
        return () => { stopped = true; if (timer)
            window.clearTimeout(timer); };
    }, [params, ref]);
    const paid = state === "PAID";
    const deposit = payment?.invoiceType === "DEPOSIT";
    const renewal = payment?.invoiceType === "RENEW";
    const extra = payment?.invoiceType === "EXTRA";
    const invoiceLabel = deposit ? "Hóa đơn đặt cọc" : renewal ? "Hóa đơn gia hạn" : extra ? "Hóa đơn phụ phí" : "Hóa đơn tiền thuê";
    const rentalPath = contract?.id ? `/rentals/${encodeURIComponent(contract.id)}` : "/rentals";
    return <main className="payment-result-page stitch-customer sc-payment-result">
    <div className="payment-result-shell">
      <CustomerBreadcrumb items={[{ label: "Kho lưu trữ", to: "/storage" }, { label: "Xác nhận thanh toán" }]} />
      <section className={`payment-result-hero ${paid ? "success" : state === "FAILED" ? "failure" : ""}`}>
        <div className="result-icon"><Icon>{paid ? "check_circle" : state === "FAILED" ? "error" : "sync"}</Icon></div>
        <span className="result-status">{paid ? "GIAO DỊCH ĐÃ ĐƯỢC XÁC THỰC" : state === "FAILED" ? "GIAO DỊCH CHƯA THÀNH CÔNG" : "ĐANG XÁC MINH GIAO DỊCH"}</span>
        <h1>{paid ? (deposit ? "Thanh toán tiền cọc thành công" : renewal ? "Gia hạn hợp đồng thành công" : extra ? "Thanh toán phụ phí thành công" : "Thuê kho thanh toán thành công · chờ bàn giao") : state === "FAILED" ? "Thanh toán chưa thành công" : "Đang xác minh thanh toán"}</h1>
        <p>{message}</p>
        <div className="receipt-meta"><span>Mã giao dịch: <strong>{ref || "—"}</strong></span><span>Thời gian: {payment?.paidAt || payment?.createdAt ? new Date(payment.paidAt || payment.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</span></div>
      </section>
      {paid ? <>
        <section className="receipt-card">
          <div className="receipt-card-heading"><div><span className="eyebrow">CHI TIẾT BIÊN NHẬN ĐIỆN TỬ</span><h2>{invoiceLabel} · {display(payment?.invoiceId)}</h2></div><span className="paid-pill">✓ ĐÃ THANH TOÁN</span></div>
          <div className="receipt-main-grid">
            <UnitImage unit={reservation || contract} className="receipt-image" screen="scr_05_thanh_to_n_success"/>
            <div><h3>{deposit ? "Kho đã đặt giữ chỗ" : renewal ? "Hợp đồng tiếp tục hiệu lực" : extra ? "Kho liên quan phụ phí" : "Kho đang thuê"}</h3><p>Cơ sở: <strong>{display(payment?.facilityCode || reservation?.facilityCode || contract?.facilityCode)}</strong></p><p>Mã kho: <strong>{display(contract?.unitCode || reservation?.unitCode)}</strong></p><p>Khách hàng: <strong>{display(payment?.customerName || contract?.customerName || reservation?.customerName)}</strong></p>{(contract?.id || payment?.contractId) && <p>Hợp đồng: <strong>{display(contract?.id || payment?.contractId)}</strong></p>}{extra && invoice?.description && <p>Nội dung: {invoice.description}</p>}<strong className="receipt-amount">{money(payment?.amount)}</strong></div>
          </div>
          <div className="receipt-facts"><span>Phương thức<strong>{display(payment?.paymentMethod || "VNPay")}</strong></span><span>Trạng thái<strong>Đã xác nhận</strong></span><span>Loại khoản thu<strong>{deposit ? "Tiền cọc" : renewal ? "Tiền gia hạn" : extra ? "Phụ phí" : "Tiền thuê kỳ đầu"}</strong></span><span>{extra ? "Hiệu lực hợp đồng" : "Quyền truy cập"}<strong>{extra ? "Không thay đổi do thanh toán phụ phí" : renewal ? "Theo hợp đồng đã gia hạn" : deposit ? "Sau thanh toán thuê và bàn giao" : "Sau khi xác nhận bàn giao"}</strong></span></div>
          {deposit && <div className="appointment-box"><strong>▣ Lịch hẹn nhận kho tiếp theo</strong><b>{dateText(reservation?.appointmentAt || reservation?.appointment, true)}</b><span>Đến đúng giờ hẹn tại cơ sở. Quản lý sẽ gán kho cụ thể nếu đơn chưa có mã kho.</span></div>}
          {extra && <div className="appointment-box"><strong>✓ Phụ phí đã được thanh toán</strong><span>Khoản thu gắn với hợp đồng hiện có. Thanh toán này không tạo bàn giao mới hoặc mở lại quyền truy cập của hợp đồng đã kết thúc.</span></div>}
          {!deposit && !extra && contract && (renewal ? <div className="appointment-box"><strong>✓ Hợp đồng đã gia hạn</strong><span>Ngày hết hạn mới: <b>{display(contract.endAt || contract.endDate)}</b></span><span>Kho và PIN hiện tại tiếp tục được giữ nguyên.</span></div> : <div className="appointment-box"><strong>✓ Hợp đồng đã thanh toán · chờ nhân viên bàn giao</strong><span>Mã cơ sở: <b>{display(contract.facilityCode)}</b></span><span>Mã kho: <b>{display(contract.unitCode)}</b></span><span>PIN chỉ được sử dụng sau khi nhân viên xác nhận bàn giao thành công.</span><span>Xuất trình mã cơ sở và mã kho cho Staff để hoàn tất bàn giao.</span></div>)}
        </section>
        <section className="next-steps"><div className="section-heading"><h2>Các bước tiếp theo của bạn</h2><span>HƯỚNG DẪN NGẮN</span></div><div className="next-step-grid">{extra ? <><article><b>1</b><div><h3>Kiểm tra hóa đơn phụ phí</h3><p>Đối chiếu nội dung khoản thu với hợp đồng và biên bản nghiệp vụ liên quan.</p></div></article><article><b>2</b><div><h3>Lưu giao dịch thanh toán</h3><p>Xem biên nhận trong lịch sử giao dịch. Trạng thái hợp đồng vẫn tuân theo quá trình thuê hoặc trả kho.</p></div></article></> : renewal ? <><article><b>1</b><div><h3>Kiểm tra thời hạn mới</h3><p>Mở hợp đồng để xem ngày kết thúc đã cập nhật sau thanh toán.</p></div></article><article><b>2</b><div><h3>Tiếp tục sử dụng kho</h3><p>Gia hạn giữ nguyên kho đang thuê và không yêu cầu bàn giao lại.</p></div></article></> : deposit ? <><article><b>1</b><div><h3>Mang theo giấy tờ tùy thân</h3><p>Đến cơ sở đúng ngày và giờ trên thẻ hẹn để nhân viên đối chiếu thông tin.</p></div></article><article><b>2</b><div><h3>Theo dõi thẻ hẹn</h3><p>Quản lý sẽ gán kho cụ thể. Thanh toán RENT và hoàn tất bàn giao trước khi nhận thẻ Check-in/hợp đồng.</p></div></article></> : <><article><b>1</b><div><h3>Kiểm tra biên bản bàn giao</h3><p>Cùng Staff kiểm tra hiện trạng kho và nội dung bàn giao.</p></div></article><article><b>2</b><div><h3>Xác nhận nhận kho</h3><p>Xác nhận biên bản trên thẻ Check-in để hợp đồng được kích hoạt.</p></div></article></>}</div><p className="security-note">✓ Kho và giao dịch của bạn được bảo vệ bằng hệ thống quản lý an toàn.</p></section>
        <div className="receipt-actions"><Link className="button secondary" to="/">Về trang chủ</Link>{deposit && Boolean(reservation?.id) && <Link className="button" to={`/reservations/${encodeURIComponent(String(reservation?.id))}/appointment`}>Xem thẻ hẹn của tôi →</Link>}{!deposit && <Link className="button" to={renewal || extra ? rentalPath : reservation?.id || payment?.reservationId ? `/reservations/${encodeURIComponent(String(reservation?.id || payment.reservationId))}/pass` : rentalPath}>{renewal || extra ? "Xem hợp đồng liên quan →" : "Mở thẻ Check-in &amp; PIN →"}</Link>}<Link className="button" to="/payments">Xem lịch sử giao dịch →</Link></div>
      </> : <section className="receipt-card pending-result"><h2>{state === "FAILED" ? "Giao dịch chưa được ghi nhận" : "Đang chờ xác nhận từ VNPay"}</h2><p>Mã giao dịch: <strong>{ref || "—"}</strong></p><Link className="button" to="/invoices/all/pay">Quay lại hóa đơn</Link></section>}
      <p className="receipt-help">Cần hỗ trợ đối chiếu hóa đơn hoặc giao dịch? Liên hệ hotline <strong>1900 6868</strong>.</p>
    </div>
  </main>;
}
