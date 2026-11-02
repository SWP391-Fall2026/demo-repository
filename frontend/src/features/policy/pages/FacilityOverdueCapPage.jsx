import { useEffect, useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { useSession } from "../../identity/session";
import { policyApi } from "../api/policy.api";
import { OfficeHeading, OfficeIcon, OfficeState } from "../../../shared/ui/office/OfficeUi";
export default function FacilityOverdueCapPage() {
  const session = useSession(); const remote = useRemote(policyApi.get); const [percentage, setPercentage] = useState(50); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const facilityCode = session?.user?.facilityCode; const current = remote.data?.[`cap.${facilityCode}`] ?? "50";
  useEffect(() => { setPercentage(current); }, [current]);
  async function save(event) { event.preventDefault(); setBusy(true); setError(""); setMessage(""); try { await policyApi.cap({ percentage: Number(percentage) }); setMessage("Đã cập nhật trần phí cho cơ sở phụ trách."); remote.reload(); } catch (cause) { setError(cause.message || "Không thể lưu trần phí."); } finally { setBusy(false); } }
  return <div className="office-page"><OfficeHeading title="Trần phí quá hạn tại cơ sở" eyebrow="FACILITY MANAGER / CHÍNH SÁCH CƠ SỞ" description="Backend áp dụng trần trên giá thuê tháng hiện hành và kiểm tra phạm vi cơ sở."><button type="button" className="secondary" onClick={remote.reload}><OfficeIcon>sync</OfficeIcon>Làm mới</button></OfficeHeading>{remote.busy && !remote.data ? <OfficeState busy /> : remote.error ? <OfficeState error={remote.error} onRetry={remote.reload} /> : <section className="card"><dl className="office-detail-grid"><div><dt>Cơ sở phụ trách</dt><dd>{facilityCode || "Chưa được gán"}</dd></div><div><dt>Trần hiện tại</dt><dd>{current}% giá thuê tháng</dd></div></dl><form className="form-grid" onSubmit={save}><label>Trần phí quá hạn (%)<input type="number" min="0" max="100" step="0.01" required value={percentage} onChange={(event) => setPercentage(event.target.value)} /></label><div className="form-actions"><button type="submit" disabled={busy || !facilityCode}>{busy ? "Đang lưu…" : "Cập nhật trần phí"}</button>{error && <p className="error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}</div></form></section>}</div>;
}
