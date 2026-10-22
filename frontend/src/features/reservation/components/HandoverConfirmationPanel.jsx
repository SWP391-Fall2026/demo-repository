import { useEffect, useState } from "react";
import { display } from "../../../shared/lib/format";
import { rentalApi } from "../../rental/api/rental.api";
export default function HandoverConfirmationPanel({ contract, onDone }) {
    const [detail, setDetail] = useState(null);
    const [evidenceUrl, setEvidenceUrl] = useState("");
    const [checks, setChecks] = useState({ customerInspectionConfirmed: false, handoverRecordConfirmed: false, receivedUnitConfirmed: false });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const handover = detail?.handover;
    const reservation = detail?.reservation;
    const customer = detail?.customer;
    const facility = detail?.facility;
    const unit = detail?.unit;
    async function loadDetail() {
        const value = await rentalApi.detail(String(contract.id));
        setDetail(value);
        const row = value.handover;
        if (row?.evidenceAvailable && !evidenceUrl) {
            const objectUrl = await rentalApi.loadHandoverEvidence(String(contract.id));
            setEvidenceUrl(objectUrl);
        }
    }
    useEffect(() => {
        let active = true;
        let objectUrl = "";
        rentalApi.detail(String(contract.id)).then(async (value) => {
            if (!active)
                return;
            setDetail(value);
            const row = value.handover;
            if (row?.evidenceAvailable) {
                objectUrl = await rentalApi.loadHandoverEvidence(String(contract.id));
                if (active)
                    setEvidenceUrl(objectUrl);
                else
                    URL.revokeObjectURL(objectUrl);
            }
        }).catch((cause) => active && setError(cause instanceof Error ? cause.message : "Không tải được biên bản bàn giao."));
        return () => { active = false; if (objectUrl)
            URL.revokeObjectURL(objectUrl); };
    }, [contract.id]);
    async function confirm() {
        setBusy(true);
        setError("");
        try {
            await rentalApi.confirmHandover(String(contract.id), { ...checks, confirmationVersion: "HANDOVER-2026-10" });
            setMessage("Đã xác nhận nhận kho. Hợp đồng đã ACTIVE.");
            onDone();
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không xác nhận được bàn giao.");
        }
        finally {
            setBusy(false);
        }
    }
    async function reportIssue() {
        setBusy(true);
        setError("");
        try {
            await rentalApi.reportHandoverIssue(String(contract.id));
            await loadDetail();
            setMessage("Đã báo kho có vấn đề. Liên hệ Staff cơ sở theo thông tin bên dưới.");
            onDone();
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không gửi được báo vấn đề.");
        }
        finally {
            setBusy(false);
        }
    }
    if (!detail || !handover)
        return null;
    const awaitingCustomer = handover.status === "PENDING_CUSTOMER_CONFIRMATION";
    const issue = handover.status === "ISSUE_REPORTED" || handover.conditionStatus === "ISSUE";
    return <section className="handover-customer-confirm">
    <header className="handover-confirm-heading"><div><span className="eyebrow">BIÊN BẢN BÀN GIAO</span><h3>Xác nhận nhận kho</h3><p>Kiểm tra thông tin và hiện trạng Staff đã ghi trước khi xác nhận.</p></div><span className={`badge ${awaitingCustomer && !issue ? "pending" : "danger"}`}>{handover.status === "ISSUE_REPORTED" ? "ĐANG XỬ LÝ VẤN ĐỀ" : issue ? "CẦN STAFF XỬ LÝ" : display(handover.status)}</span></header>
    <div className="handover-context-grid">
      <div><small>MÃ RESERVATION</small><strong>{display(reservation?.id || handover.reservationId)}</strong></div>
      <div><small>MÃ CONTRACT</small><strong>{display(detail.contract && detail.contract.id || handover.contractId)}</strong></div>
      <div><small>KHÁCH HÀNG</small><strong>{display(customer?.name || contract.customerName)}</strong></div>
      <div><small>CƠ SỞ</small><strong>{display(facility?.name || contract.facilityCode)} · {display(facility?.code || contract.facilityCode)}</strong></div>
      <div><small>UNIT</small><strong>{display(unit?.code || contract.unitCode)}</strong></div>
      <div><small>HỢP ĐỒNG</small><strong>Đã thanh toán · {display(contract.status)}</strong></div>
    </div>
    <section className="handover-record-review"><header><div><h4>Thông tin bàn giao thực tế</h4><span>Staff: {display(handover.staffId)} · {display(handover.handoverDate)}</span></div><span className={`badge ${handover.conditionStatus === "CLEAN" ? "success" : "danger"}`}>{handover.conditionStatus === "CLEAN" ? "Kho sử dụng bình thường" : "Có vấn đề cần ghi nhận"}</span></header>
      <dl><div><dt>Hiện trạng</dt><dd>{display(handover.unitConditionNotes)}</dd></div>{Boolean(handover.staffNotes) && <div><dt>Ghi chú Staff</dt><dd>{display(handover.staffNotes)}</dd></div>}{Boolean(handover.customerIssueNotes) && <div><dt>Vấn đề Customer báo</dt><dd>{display(handover.customerIssueNotes)}</dd></div>}</dl>
      {evidenceUrl ? <img className="handover-evidence" src={evidenceUrl} alt="Ảnh hiện trạng Unit do Staff đính kèm"/> : <p className="handover-no-evidence">Staff không đính kèm ảnh hiện trạng.</p>}
    </section>
    {awaitingCustomer && !issue && <div className="handover-confirm-actions"><div className="handover-confirm-checks">
      <label><input type="checkbox" checked={checks.customerInspectionConfirmed} onChange={(e) => setChecks({ ...checks, customerInspectionConfirmed: e.target.checked })}/><span>Tôi đã kiểm tra kho thực tế và xác nhận đúng Unit được bàn giao.</span></label>
      <label><input type="checkbox" checked={checks.handoverRecordConfirmed} onChange={(e) => setChecks({ ...checks, handoverRecordConfirmed: e.target.checked })}/><span>Tôi đã xem biên bản và xác nhận hiện trạng được ghi đúng.</span></label>
      <label><input type="checkbox" checked={checks.receivedUnitConfirmed} onChange={(e) => setChecks({ ...checks, receivedUnitConfirmed: e.target.checked })}/><span>Tôi xác nhận đã nhận kho và đồng ý ghi nhận thời điểm bàn giao.</span></label>
    </div><button type="button" onClick={() => void confirm()} disabled={busy || !checks.customerInspectionConfirmed || !checks.handoverRecordConfirmed || !checks.receivedUnitConfirmed}>{busy ? "Đang xác nhận…" : "Xác nhận đã nhận kho"}</button>
      <button type="button" className="secondary" onClick={() => void reportIssue()} disabled={busy}>{busy ? "Đang gửi…" : "Báo kho có vấn đề"}</button>
    </div>}
    {issue && <div className="handover-issue-notice"><p className="notice">Bàn giao đang chờ Staff xử lý. Hợp đồng chưa được kích hoạt. Liên hệ nhân viên cơ sở:</p><strong>{display(handover.staffName)}</strong>{handover.staffPhone ? <a className="handover-staff-phone" href={`tel:${String(handover.staffPhone).replace(/[^+\d]/g, "")}`}>{display(handover.staffPhone)}</a> : <span>Chưa có số điện thoại nhân viên; liên hệ hotline cơ sở.</span>}{handover.status !== "ISSUE_REPORTED" && <button type="button" className="secondary" onClick={() => void reportIssue()} disabled={busy}>{busy ? "Đang gửi…" : "Báo cần Staff xử lý"}</button>}</div>}
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
  </section>;
}
