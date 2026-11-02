import { useMemo, useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { policyApi } from "../api/policy.api";
import { OfficeDialog, OfficeHeading, OfficeIcon, OfficeMetrics, OfficeState } from "../../../shared/ui/office/OfficeUi";

const labels = {
  "price.S": "Giá kho S", "price.M": "Giá kho M", "price.L": "Giá kho L", "price.CLIMATE": "Giá kho Climate",
  cleaningFee: "Phí vệ sinh", overdueDailyFee: "Phí quá hạn/ngày", newLockFee: "Phí thay khóa", depositMonths: "Số tháng cọc",
  "gracePeriodDays": "Số ngày ân hạn", "cancellation.fullRefundHours": "Thời hạn hoàn cọc đủ điều kiện (giờ)",
  "feeWaiver.overduePercent": "Miễn phí quá hạn (%)", "feeWaiver.cleaningPercent": "Miễn phí vệ sinh (%)", "feeWaiver.lockPercent": "Miễn phí thay khóa (%)",
  "discount.3": "Giảm giá 3 tháng", "discount.6": "Giảm giá 6 tháng", "discount.12": "Giảm giá 12 tháng",
};
export default function PolicyEditorPage({ mode }) {
  const remote = useRemote(policyApi.get); const [query, setQuery] = useState(""); const [selected, setSelected] = useState(null); const [value, setValue] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const data = remote.data && typeof remote.data === "object" ? remote.data : {};
  const all = Object.entries(data);
  if (mode === "pricing" && remote.data) for (const type of ["S", "M", "L", "CLIMATE"]) for (const bound of ["min", "max"]) {
    const key = `price.${bound}.${type}`;
    if (!(key in data)) all.push([key, data[`price.${type}`]]);
  }
  const keys = mode === "pricing" ? all.filter(([key]) => key.startsWith("price.") || ["cleaningFee", "overdueDailyFee", "newLockFee", "discount.3", "discount.6", "discount.12"].includes(key)) : mode === "rental" ? all.filter(([key]) => ["depositMonths", "gracePeriodDays", "cancellation.fullRefundHours", "feeWaiver.overduePercent", "feeWaiver.cleaningPercent", "feeWaiver.lockPercent"].includes(key)) : all.filter(([key]) => key.startsWith("cap."));
  const visible = useMemo(() => keys.filter(([key, current]) => !query || `${key} ${labels[key] || ""} ${current}`.toLowerCase().includes(query.trim().toLowerCase())), [keys, query]);
  const open = ([key, current]) => { setSelected(key); setValue(current); setError(""); };
  async function save(event) { event.preventDefault(); setBusy(true); setError(""); try { if (mode === "cap") await policyApi.cap({ percentage: Number(value) }); else await policyApi.save({ key: selected, value }); setSelected(null); setMessage("Đã cập nhật chính sách."); remote.reload(); } catch (cause) { setError(cause.message || "Không thể cập nhật chính sách."); } finally { setBusy(false); } }
  const title = mode === "pricing" ? "Khung giá và phụ phí" : mode === "rental" ? "Chính sách cho thuê" : "Trần phí quá hạn tại cơ sở";
  return <div className="office-page office-resource"><OfficeHeading title={title} eyebrow="OPS / POLICY" description="Chọn trực tiếp tham số trong bảng; khóa chính sách do hệ thống cung cấp từ backend."><button type="button" className="secondary" onClick={remote.reload}><OfficeIcon>sync</OfficeIcon>Làm mới</button></OfficeHeading><OfficeMetrics items={[{ label: "Tham số hiển thị", value: keys.length, icon: "tune", tone: "blue" }, { label: "Đang lọc", value: visible.length, icon: "filter_alt", tone: "green" }]} />{(message || error || remote.error) && <div className={`office-alert ${error || remote.error ? "office-alert-error" : "office-alert-success"}`} role="alert">{error || remote.error || message}</div>}<section className="office-filter"><label className="office-search"><OfficeIcon>search</OfficeIcon><input aria-label="Tìm chính sách" placeholder="Tìm tên hoặc khóa chính sách…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></section><section className="card office-table"><div className="office-table-header"><h2>Tham số chính sách <span className="count">{visible.length}</span></h2></div>{remote.busy && !remote.data ? <OfficeState busy /> : remote.error ? <OfficeState error={remote.error} onRetry={remote.reload} /> : !visible.length ? <OfficeState title="Không có tham số phù hợp" onRetry={() => setQuery("")} /> : <div className="table-scroll"><table><thead><tr><th>Tham số</th><th>Ý nghĩa</th><th>Giá trị hiện tại</th><th>Thao tác</th></tr></thead><tbody>{visible.map((entry) => <tr key={entry[0]}><td><code>{entry[0]}</code></td><td>{labels[entry[0]] || entry[0]}</td><td>{entry[1]}</td><td><button type="button" className="office-row-action" onClick={() => open(entry)}>Chỉnh sửa <OfficeIcon>edit</OfficeIcon></button></td></tr>)}</tbody></table></div>}</section>{selected && <OfficeDialog title={`Cập nhật ${labels[selected] || selected}`} onClose={() => setSelected(null)}><form className="form-grid" onSubmit={save}><p>Khóa: <code>{selected}</code></p><label>Giá trị<input required type="number" step="any" value={value} onChange={(event) => setValue(event.target.value)} /></label><div className="form-actions"><button type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu chính sách"}</button>{error && <p className="error" role="alert">{error}</p>}</div></form></OfficeDialog>}</div>;
}
