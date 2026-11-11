import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { reservationApi } from "../api/reservation.api";
import { billingApi } from "../../billing/api/billing.api";
import { facilityApi } from "../../facility/api/facility.api";
import CustomerRentalGuide from "../components/CustomerRentalGuide";
import { usePersistedState } from "../../../shared/lib/persisted-state";

const FALLBACK_FACILITY_OPTIONS = [
    { code: "HN-CG", name: "Cơ sở Cầu Giấy" },
    { code: "HN-NTL", name: "Cơ sở Nam Từ Liêm" },
    { code: "HCM-TB", name: "Cơ sở Tân Bình" },
    { code: "HCM-Q7", name: "Cơ sở Quận 7" },
    { code: "DN-HC", name: "Cơ sở Hải Châu" },
];

export default function CreateReservationPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [draft, setDraft, resetDraft] = usePersistedState("reservation.create.draft", {
        facilityCode: "HN-CG",
        unitType: "S",
        startDate: "",
        durationMonths: "1",
        appointmentAt: "",
    });
    const facilityCode = params.get("facility") || draft.facilityCode || "HN-CG";
    const unitType = params.get("type") || draft.unitType || "S";
    const checkInDate = String(draft.appointmentAt || "").slice(0, 10);
    const [facilities, setFacilities] = useState(FALLBACK_FACILITY_OPTIONS);
    const unitCode = params.get("unit") || "";

    useEffect(() => {
        let cancelled = false;
        facilityApi.facilities()
            .then((list) => {
                if (!cancelled && Array.isArray(list) && list.length > 0) {
                    setFacilities(list.filter((f) => !f.status || String(f.status).toUpperCase() === "ACTIVE"));
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);
    async function submit(event) {
        event.preventDefault();
        if (busy)
            return;
        const startDate = String(draft.startDate ?? "");
        const appointmentAt = String(draft.appointmentAt ?? "");
        const appointmentDate = appointmentAt.slice(0, 10);
        if (startDate < appointmentDate) {
            setError("Ngày bắt đầu thuê không được trước ngày check-in.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const reservation = await reservationApi.create({
                facilityCode,
                unitType,
                startDate,
                rentalStartAt: startDate === appointmentDate ? appointmentAt : `${startDate}T00:00:00`,
                appointmentAt,
                durationMonths: Number(draft.durationMonths || 1),
            });
            const invoices = await billingApi.invoices();
            const deposit = invoices.find((invoice) => invoice.reservationId === reservation.id && invoice.invoiceType === "DEPOSIT");
            if (!deposit?.id)
                throw new Error("Đơn đã tạo nhưng chưa tìm thấy hóa đơn đặt cọc.");
            resetDraft();
            navigate(`/invoices/${encodeURIComponent(String(deposit.id))}/pay`, { replace: true });
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không tạo được đơn đặt cọc.");
        }
        finally {
            setBusy(false);
        }
    }
    return (<main className="page-content">
      <header className="page-heading">
        <div>
          <span className="eyebrow">FLOW 1 / ĐẶT GIỮ CHỖ</span>
          <h1>Đặt cọc kho</h1>
          <p>Đơn chờ cọc trong 30 phút. Quá hạn, đơn tự hủy và cần đặt lại.</p>
        </div>
      </header>
      <CustomerRentalGuide active={1}/>
      {unitCode && <section className="card">
        <p>Kho đã chọn: <strong>{unitCode}</strong> · loại {unitType} · cơ sở {facilityCode}</p>
        <p>Đơn được giữ theo cơ sở và loại kho; quản lý cơ sở gán mã kho cụ thể sau khi đặt cọc.</p>
      </section>}
      <form className="card form-grid" onSubmit={submit}>
        {!params.get("facility") && (
          <label>Cơ sở chi nhánh
            <select value={facilityCode} onChange={(e) => setDraft((prev) => ({ ...prev, facilityCode: e.target.value }))} required>
              {facilities.map((facility) => (
                <option key={String(facility.code)} value={String(facility.code)}>
                  {String(facility.name)} ({String(facility.code)})
                </option>
              ))}
            </select>
          </label>
        )}
        {!params.get("type") && (
          <label>Loại kho lưu trữ
            <select value={unitType} onChange={(e) => setDraft((prev) => ({ ...prev, unitType: e.target.value }))} required>
              <option value="S">Loại S - Nhỏ (1 - 3 m²)</option>
              <option value="M">Loại M - Vừa (4 - 8 m²)</option>
              <option value="L">Loại L - Lớn (&gt; 8 m²)</option>
            </select>
          </label>
        )}
        <label>Ngày bắt đầu thuê
          <input name="startDate" type="date" value={String(draft.startDate || "")} min={checkInDate || undefined} onChange={(event) => setDraft((prev) => ({ ...prev, startDate: event.target.value }))} required/>
        </label>
        <label>Số tháng thuê
          <input name="durationMonths" type="number" min="1" max="36" value={String(draft.durationMonths || "1")} onChange={(event) => setDraft((prev) => ({ ...prev, durationMonths: event.target.value }))} required/>
        </label>
        <label>Ngày và giờ hẹn check-in
          <input name="appointmentAt" type="datetime-local" value={String(draft.appointmentAt || "")} required onChange={(event) => setDraft((prev) => ({ ...prev, appointmentAt: event.target.value }))}/>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn-figma btn-primary-dark" type="submit" disabled={busy || !facilityCode}>
          {busy ? "Đang tạo đơn…" : "Tạo đơn và đặt cọc"}
        </button>
      </form>
    </main>);
}
