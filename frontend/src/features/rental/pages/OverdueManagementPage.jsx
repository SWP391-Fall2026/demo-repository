import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { rentalApi } from "../api/rental.api";
import { display, money } from "../../../shared/lib/format";
import { OfficeHeading, OfficeIcon, OfficeState, OfficeMetrics } from "../../../shared/ui/office/OfficeUi";
import "../../reporting/pages/facility-manager-stitch.css";

export default function OverdueManagementPage() {
  const remote = useRemote(rentalApi.overdue);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const rows = Array.isArray(remote.data) ? remote.data : [];
  async function act(id, action) {
    setBusy(`${id}:${action}`); setError(""); setMessage("");
    try { await rentalApi.overdueAction(id, action); setMessage("Đã ghi nhận thao tác quá hạn."); remote.reload(); }
    catch (cause) { setError(cause.message || "Không thể xử lý hợp đồng quá hạn."); }
    finally { setBusy(""); }
  }
  return <div className="office-page">
    <OfficeHeading title="Quản lý hợp đồng quá hạn" eyebrow="FACILITY MANAGER / OVERDUE" description="Theo dõi công nợ, nhắc khách và khởi tạo quy trình trả kho trong phạm vi cơ sở.">
      <button className="secondary" onClick={remote.reload}><OfficeIcon>sync</OfficeIcon>Làm mới</button>
    </OfficeHeading>
    <OfficeMetrics items={[{label:"Hợp đồng quá hạn",value:rows.length,icon:"warning",tone:"amber",note:"Theo cơ sở phụ trách"},{label:"Đã yêu cầu trả kho",value:rows.filter(r=>r.checkoutRequestedAt).length,icon:"assignment_return",tone:"blue",note:"Chờ nghiệm thu"}]} />
    {(error || message) && <div className={`office-alert ${error ? "office-alert-error" : "office-alert-success"}`}>{error || message}</div>}
    <section className="card office-table"><div className="office-table-header"><h2>Danh sách quá hạn <span className="count">{rows.length}</span></h2></div>
      {remote.error ? <OfficeState error={remote.error} onRetry={remote.reload}/> : remote.busy ? <OfficeState busy/> : !rows.length ? <OfficeState title="Không có hợp đồng quá hạn" icon="check_circle"/> : <div className="table-scroll"><table><thead><tr><th>Hợp đồng</th><th>Kho</th><th>Khách hàng</th><th>Hết hạn</th><th>Giá thuê</th><th>Thao tác</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{display(row.id)}</td><td>{display(row.unitCode)}</td><td>{display(row.customerName)}</td><td>{display(row.endDate || row.endAt)}</td><td>{money(row.monthlyFee)}</td><td><div className="office-actions"><button className="secondary" disabled={busy===`${row.id}:REMIND`} onClick={()=>act(row.id,"REMIND")}>Nhắc khách</button><button className="secondary" disabled={busy===`${row.id}:LOCK`} onClick={()=>act(row.id,"LOCK")}>Khóa PIN</button><button disabled={busy===`${row.id}:REQUEST_RETURN`} onClick={()=>act(row.id,"REQUEST_RETURN")}>Yêu cầu trả kho</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
