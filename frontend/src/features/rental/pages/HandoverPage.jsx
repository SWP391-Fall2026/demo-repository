import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function HandoverPage() {
    const [evidence, setEvidence] = useState();
    const eligible = useRemote(rentalApi.eligibleHandovers);
    const [selectedId, setSelectedId] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState("");
    const [busy, setBusy] = useState(false);
    async function submit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        setBusy(true);
        setError("");
        setDone("");
        const data = new FormData(form);
        const payload = {};
        data.forEach((value, key) => { if (key !== "evidence")
            payload[key] = value; });
        payload.handoverEligibleConfirmed = data.get("handoverEligibleConfirmed") === "on";
        try {
            await rentalApi.handover(payload, evidence);
            setDone("Đã lập biên bản, chờ khách xác nhận.");
            form.reset();
            setSelectedId("");
            setEvidence(undefined);
            eligible.reload();
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không lập được biên bản.");
        }
        finally {
            setBusy(false);
        }
    }
    return (<ResourcePage title="Check-in và bàn giao kho" description="Staff lập biên bản hiện trạng. Customer xem biên bản và xác nhận riêng; chỉ sau đó hợp đồng mới ACTIVE." load={rentalApi.list}>
      <form className="form-grid" onSubmit={submit}>
        <section className="handover-form-section"><h3>A. Reservation và hợp đồng</h3>
          <label>Hồ sơ đã thanh toán, chờ bàn giao<select name="reservationId" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} required><option value="">Chọn hồ sơ</option>{(Array.isArray(eligible.data) ? eligible.data : []).map((row) => <option key={String(row.reservationId)} value={String(row.reservationId)}>{String(row.reservationId)} · {String(row.customerName)} · {String(row.unitCode)}</option>)}</select></label>
          {(() => { const row = (Array.isArray(eligible.data) ? eligible.data : []).find((item) => String(item.reservationId) === selectedId); return row ? <div className="handover-context-grid"><div><small>MÃ RESERVATION</small><strong>{String(row.reservationId)}</strong></div><div><small>MÃ HỢP ĐỒNG</small><strong>{String(row.contractId)}</strong></div><div><small>KHÁCH HÀNG</small><strong>{String(row.customerName)} · {String(row.customerPhone)}</strong></div><div><small>CƠ SỞ / UNIT</small><strong>{String(row.facilityName)} · {String(row.facilityCode)} / {String(row.unitCode)}</strong></div><div><small>THANH TOÁN</small><strong>DEPOSIT {String(row.depositStatus)} · RENT {String(row.rentStatus)}</strong></div>{Boolean(row.previousIssueNotes) && <div><small>KHÁCH ĐÃ BÁO</small><strong>{String(row.previousIssueNotes)}</strong></div>}{Boolean(row.previousConditionNotes) && <div><small>HIỆN TRẠNG TRƯỚC</small><strong>{String(row.previousConditionNotes)}</strong></div>}<input type="hidden" name="unitCode" value={String(row.unitCode)}/></div> : <p>Chọn hồ sơ; thông tin khách, cơ sở và Unit được nạp từ hệ thống.</p>; })()}
        </section>
        <section className="handover-form-section"><h3>B. Bàn giao thực tế</h3>
          <label>Tình trạng kho<select name="conditionStatus" defaultValue="CLEAN"><option value="CLEAN">Kho sạch sẽ, sử dụng bình thường</option><option value="ISSUE">Có vấn đề cần ghi nhận</option></select></label>
          <label>Hiện trạng / hư hỏng<textarea name="unitConditionNotes" required/></label>
          <label>Ghi chú Staff<textarea name="staffNotes"/></label>
          <label>Ảnh hiện trạng<input name="evidence" type="file" accept="image/png,image/jpeg" onChange={(event) => setEvidence(event.target.files?.[0])}/></label>
          <label className="check-row"><input name="handoverEligibleConfirmed" type="checkbox" required/> Đã xác nhận khách đủ điều kiện nhận bàn giao</label>
        </section>
        <div className="form-actions">{error && <p className="error">{error}</p>}{done && <p className="notice">{done}</p>}<button disabled={busy}>{busy ? "Đang lập biên bản…" : "Lập biên bản bàn giao"}</button></div>
      </form>
    </ResourcePage>);
}
