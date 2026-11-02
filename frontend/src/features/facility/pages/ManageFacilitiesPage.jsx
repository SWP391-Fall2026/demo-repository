import { useMemo, useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { facilityApi } from "../api/facility.api";
import { OfficeDialog, OfficeHeading, OfficeIcon, OfficeMetrics, OfficeState } from "../../../shared/ui/office/OfficeUi";

const EMPTY = { code: "", name: "", address: "", city: "", hotline: "", status: "ACTIVE" };

export default function ManageFacilitiesPage() {
  const remote = useRemote(facilityApi.facilities);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const rows = Array.isArray(remote.data) ? remote.data : [];
  const visible = useMemo(() => rows.filter((row) => {
    const text = [row.code, row.name, row.address, row.city].join(" ").toLowerCase();
    return (!query || text.includes(query.trim().toLowerCase())) && (!status || row.status === status);
  }), [rows, query, status]);
  const open = (row) => { setError(""); setMessage(""); setForm(row ? { ...EMPTY, ...row } : { ...EMPTY }); setDialog(row ? "edit" : "create"); };
  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  async function save(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { if (dialog === "create") await facilityApi.createFacility(form); else await facilityApi.updateFacility(form); setDialog(null); setMessage(dialog === "create" ? "Đã tạo cơ sở." : "Đã cập nhật cơ sở."); remote.reload(); }
    catch (cause) { setError(cause.message || "Không thể lưu cơ sở."); }
    finally { setBusy(false); }
  }
  return <div className="office-page office-resource">
    <OfficeHeading title="Quản lý cơ sở" eyebrow="OPS / CHUỖI CƠ SỞ" description="Theo dõi sức chứa và cập nhật trạng thái từng cơ sở bằng dữ liệu thật.">
      <button type="button" className="secondary" onClick={remote.reload}><OfficeIcon>sync</OfficeIcon>Làm mới</button>
      <button type="button" onClick={() => open()}><OfficeIcon>add_business</OfficeIcon>Thêm cơ sở</button>
    </OfficeHeading>
    <OfficeMetrics items={[{ label: "Tổng cơ sở", value: rows.length, icon: "domain", tone: "blue" }, { label: "Đang hoạt động", value: rows.filter((row) => row.status === "ACTIVE").length, icon: "check_circle", tone: "green" }, { label: "Ngừng hoạt động", value: rows.filter((row) => row.status !== "ACTIVE").length, icon: "pause_circle", tone: "amber" }, { label: "Tổng kho", value: rows.reduce((sum, row) => sum + Number(row.totalUnits || 0), 0), icon: "warehouse", tone: "navy" }]} />
    {(error || message || remote.error) && <div className={`office-alert ${error || remote.error ? "office-alert-error" : "office-alert-success"}`} role="alert">{error || remote.error || message}</div>}
    <section className="office-filter" aria-label="Bộ lọc cơ sở"><label className="office-search"><OfficeIcon>search</OfficeIcon><input aria-label="Tìm cơ sở" placeholder="Tìm mã, tên, địa chỉ…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label>Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></label><button type="button" className="secondary" onClick={() => { setQuery(""); setStatus(""); }}><OfficeIcon>filter_alt_off</OfficeIcon>Đặt lại</button></section>
    <section className="card office-table"><div className="office-table-header"><h2>Danh sách cơ sở <span className="count">{visible.length}</span></h2><small>{visible.length ? `Hiển thị ${visible.length} cơ sở` : "Không có dữ liệu phù hợp"}</small></div>{remote.busy && !remote.data ? <OfficeState busy /> : remote.error ? <OfficeState error={remote.error} onRetry={remote.reload} /> : !visible.length ? <OfficeState title="Chưa có cơ sở phù hợp" onRetry={() => { setQuery(""); setStatus(""); }} /> : <div className="table-scroll"><table><thead><tr><th>Mã cơ sở</th><th>Tên cơ sở</th><th>Địa chỉ</th><th>Kho</th><th>Đang thuê</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visible.map((row) => <tr key={row.code}><td><strong>{row.code}</strong></td><td>{row.name}</td><td>{row.address}, {row.city}</td><td>{row.totalUnits ?? 0}</td><td>{row.occupiedUnits ?? 0}</td><td><span className={`badge ${row.status === "ACTIVE" ? "success" : "warning"}`}>{row.status}</span></td><td><button type="button" className="office-row-action" onClick={() => open(row)}>Sửa cơ sở <OfficeIcon>edit</OfficeIcon></button></td></tr>)}</tbody></table></div>}</section>
    {dialog && <OfficeDialog title={dialog === "create" ? "Thêm cơ sở" : `Cập nhật ${form.code}`} onClose={() => setDialog(null)}><form className="form-grid" onSubmit={save}><label>Mã cơ sở<input name="code" required disabled={dialog === "edit"} value={form.code} onChange={change} /></label><label>Tên cơ sở<input name="name" required maxLength={255} value={form.name} onChange={change} /></label><label>Địa chỉ<input name="address" required maxLength={255} value={form.address} onChange={change} /></label><label>Tỉnh/thành phố<input name="city" required maxLength={100} value={form.city} onChange={change} /></label><label>Hotline<input name="hotline" maxLength={50} value={form.hotline || ""} onChange={change} /></label>{dialog === "edit" && <label>Trạng thái<select name="status" value={form.status || "ACTIVE"} onChange={change}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></label>}<div className="form-actions"><button type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</button>{error && <p className="error" role="alert">{error}</p>}</div></form></OfficeDialog>}
  </div>;
}
