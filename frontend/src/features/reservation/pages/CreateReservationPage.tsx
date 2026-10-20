import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { reservationApi } from "../api/reservation.api";
import { billingApi } from "../../billing/api/billing.api";
import type { Row } from "../../../shared/types/api";
import CustomerRentalGuide from "../components/CustomerRentalGuide";

export default function CreateReservationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const facilityCode = params.get("facility") || "";
  const unitType = params.get("type") || "S";
  const unitCode = params.get("unit") || "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const startDate = String(data.startDate ?? "");
    const appointmentAt = String(data.appointmentAt ?? "");
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
        durationMonths: Number(data.durationMonths),
      });
      const invoices = await billingApi.invoices();
      const deposit = invoices.find((invoice: Row) =>
        invoice.reservationId === reservation.id && invoice.invoiceType === "DEPOSIT");
      if (!deposit?.id) throw new Error("Đơn đã tạo nhưng chưa tìm thấy hóa đơn đặt cọc.");
      navigate(`/invoices/${encodeURIComponent(String(deposit.id))}/pay`, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tạo được đơn đặt cọc.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <span className="eyebrow">FLOW 1 / ĐẶT GIỮ CHỖ</span>
          <h1>Đặt cọc kho</h1>
          <p>Đơn chờ cọc trong 5 phút. Quá hạn, đơn tự hủy và cần đặt lại.</p>
        </div>
      </header>
      <CustomerRentalGuide active={1} />
      {unitCode && <section className="card">
        <p>Kho đã chọn: <strong>{unitCode}</strong> · loại {unitType} · cơ sở {facilityCode}</p>
        <p>Đơn được giữ theo cơ sở và loại kho; quản lý cơ sở gán mã kho cụ thể sau khi đặt cọc.</p>
      </section>}
      <form className="card form-grid" onSubmit={submit}>
        <label>Ngày bắt đầu thuê
          <input name="startDate" type="date" min={checkInDate || undefined} required />
        </label>
        <label>Số tháng thuê
          <input name="durationMonths" type="number" min="1" max="36" defaultValue="1" required />
        </label>
        <label>Ngày và giờ hẹn check-in
          <input name="appointmentAt" type="datetime-local" required
            onChange={(event) => setCheckInDate(event.target.value.slice(0, 10))} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy || !facilityCode}>
          {busy ? "Đang tạo đơn…" : "Tạo đơn và đặt cọc"}
        </button>
      </form>
    </main>
  );
}
