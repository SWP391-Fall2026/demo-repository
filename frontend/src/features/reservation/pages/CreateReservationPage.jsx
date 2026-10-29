import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createReservationCheckout } from "../lib/reservation-checkout";
import CustomerRentalGuide from "../components/CustomerRentalGuide";
import { facilityApi } from "../../facility/api/facility.api";
import { display, money } from "../../../shared/lib/format";
import { CustomerBreadcrumb, CustomerHeading, CustomerSteps, Icon, UnitImage } from "../../customer/components/StitchCustomer";
import "../../customer/components/customer.css";
export default function CreateReservationPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [checkInDate, setCheckInDate] = useState("");
    const [facilityCode, setFacilityCode] = useState(params.get("facility") || "");
    const [unitType, setUnitType] = useState(params.get("type") || "S");
    const unitCode = params.get("unit") || "";
    const [facilities, setFacilities] = useState([]);
    const [unit, setUnit] = useState(null);
    const [createdReservation, setCreatedReservation] = useState(null);
    const checkout = useRef(null);
    if (!checkout.current) checkout.current = createReservationCheckout();
    useEffect(() => { facilityApi.facilities().then((rows) => setFacilities(Array.isArray(rows) ? rows : [])).catch(() => setFacilities([])); }, []);
    useEffect(() => { if (!unitCode) return; facilityApi.units({ facilityCode }).then((rows) => setUnit((Array.isArray(rows) ? rows : []).find((item) => String(item.code) === unitCode) || null)).catch(() => setUnit(null)); }, [facilityCode, unitCode]);
    async function submit(event) {
        event.preventDefault();
        if (busy)
            return;
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        const startDate = String(data.startDate ?? "");
        const appointmentAt = String(data.appointmentAt ?? "");
        const appointmentDate = appointmentAt.slice(0, 10);
        if (!createdReservation && startDate < appointmentDate) {
            setError("Ngày bắt đầu thuê không được trước ngày check-in.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const { invoice } = await checkout.current({
                facilityCode,
                unitType,
                startDate,
                rentalStartAt: startDate === appointmentDate ? appointmentAt : `${startDate}T00:00:00`,
                appointmentAt,
                durationMonths: Number(data.durationMonths),
            }, setCreatedReservation);
            navigate(`/invoices/${encodeURIComponent(String(invoice.id))}/pay`, { replace: true });
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không tạo được đơn đặt cọc.");
        }
        finally {
            setBusy(false);
        }
    }
    return <main className="page-content stitch-customer sc-reservation-create"><CustomerBreadcrumb items={[{ label: "Kho lưu trữ", to: "/storage" }, { label: "Đặt giữ chỗ" }]} /><CustomerHeading title="Đặt giữ chỗ kho lưu trữ" description="Chọn thời hạn thuê và lịch hẹn nhận kho. Kiểm tra thông tin trước khi thanh toán tiền cọc." icon="event_available" /><CustomerSteps active={2}/><details className="sc-rental-guide"><summary>Quy trình nhận kho</summary><CustomerRentalGuide active={1}/></details><div className="stitch-reserve-grid"><section className="card"><div className="stitch-section-title"><h2><Icon>edit_calendar</Icon>Cấu hình đặt giữ chỗ</h2><span>Thông tin bắt buộc *</span></div><form onSubmit={submit}><fieldset className="stitch-form-grid" disabled={busy || Boolean(createdReservation)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><label>Cơ sở lưu trữ *<select value={facilityCode} onChange={(e) => setFacilityCode(e.target.value)} required disabled={Boolean(params.get("facility"))}><option value="">Chọn cơ sở</option>{facilities.filter((item) => !item.status || item.status === "ACTIVE").map((item) => <option key={item.code} value={item.code}>{item.name} ({item.code})</option>)}</select></label><label>Loại kho *<select value={unitType} onChange={(e) => setUnitType(e.target.value)} required disabled={Boolean(params.get("type"))}>{["S", "M", "L", "CLIMATE"].map((type) => <option value={type} key={type}>Kho {type}</option>)}</select></label><label>Ngày bắt đầu thuê *<input name="startDate" type="date" defaultValue={params.get("startDate") || ""} min={checkInDate || undefined} required/></label><label>Thời hạn thuê (tháng) *<input name="durationMonths" type="number" min="1" max="36" defaultValue={params.get("months") || "1"} required/></label><label className="full">Ngày và giờ hẹn check-in *<input name="appointmentAt" type="datetime-local" defaultValue={params.get("appointmentAt") || ""} required onChange={(event) => setCheckInDate(event.target.value.slice(0, 10))}/></label>{error && <p className="error full" role="alert">{error}</p>}{createdReservation && <p className="notice full" role="status">Đơn giữ chỗ đã tạo. Đang thử lấy hóa đơn đặt cọc; nhấn lại sẽ không tạo thêm đơn.</p>}</fieldset>{createdReservation && <p><Link to={`/reservations/${encodeURIComponent(createdReservation.id)}`}>{createdReservation.id}</Link></p>}<div className="stitch-submit-row"><p>Đơn giữ chỗ có hiệu lực trong 5 phút. Hoàn tất thanh toán tiền cọc để xác nhận.</p><button type="submit" disabled={busy || !facilityCode}>{busy ? "Đang xử lý…" : createdReservation ? "Thử lấy hóa đơn" : "Tiếp tục thanh toán"}<Icon>arrow_forward</Icon></button></div></form></section><aside><section className="card stitch-reservation-summary"><UnitImage unit={unit} screen="scr_04_chi_ti_t_lo_i_kho"/><span className="eyebrow">TÓM TẮT LỰA CHỌN</span><h2>Kho {display(unitType)} tiêu chuẩn</h2><p>{display(facilities.find((item) => item.code === facilityCode)?.name || facilityCode || "Chưa chọn cơ sở")}</p><dl className="stitch-definition"><div><dt>Loại kho</dt><dd>{display(unitType)}</dd></div><div><dt>Diện tích</dt><dd>{unit?.sizeSqm ? `${unit.sizeSqm} m²` : "Theo loại kho"}</dd></div><div><dt>Mã kho tham khảo</dt><dd>{unitCode || "Gán sau khi đặt cọc"}</dd></div><div className="total"><dt>Giá thuê / tháng</dt><dd>{unit ? money(unit.pricePerMonth) : "Theo báo giá"}</dd></div></dl></section><div className="stitch-note"><Icon>info</Icon><p>Đơn giữ theo cơ sở và loại kho. Hệ thống gán mã kho cụ thể trong quy trình check-in.</p></div></aside></div></main>;
}
