import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";
import { useSession } from "../../identity/session";

const waitingStatuses = new Set(["PENDING_CONFIRM", "PENDING_MANAGER", "PENDING_CUSTOMER", "CUSTOMER_ACCEPTED"]);
const inspectionLabels = {
    PENDING_CONFIRM: "Chờ khách xác nhận",
    PENDING_MANAGER: "Chờ quản lý xem xét",
    PENDING_CUSTOMER: "Chờ khách xác nhận đề xuất",
    CUSTOMER_ACCEPTED: "Khách đã xác nhận",
    COMPLETED: "Hoàn tất",
    CONFIRMED: "Hoàn tất",
};

function InspectionEvidence({ contractId }) {
    const [image, setImage] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        let objectUrl = "";
        rentalApi.loadInspectionEvidence(contractId).then((value) => {
            objectUrl = value;
            if (active) setImage(value);
            else URL.revokeObjectURL(value);
        }).catch(() => {
            if (active) setError("Không tải được ảnh hiện trạng đã đính kèm.");
        }, [contractId]);
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    });
    if (error) return <p className="error" role="alert">{error}</p>;
    if (!image) return <p className="muted">Đang tải ảnh hiện trạng…</p>;
    return <img className="inspection-evidence" src={image} alt="Ảnh hiện trạng kho đính kèm phiếu nghiệm thu" />;
}

export default function ReturnInspectionPage() {
    const { contractId = "" } = useParams();
    const session = useSession();
    const { data, error, busy, reload } = useRemote(rentalApi.list);
    const rows = Array.isArray(data) ? data : [];
    const contract = rows.find((row) => String(row.id) === contractId) || rows.find((row) => String(row.unitCode) === contractId);
    const requests = rows.filter((row) => String(row.status).toUpperCase() === "CHECKOUT_REQUESTED"
        || waitingStatuses.has(String(row.inspectionStatus).toUpperCase()));
    const [busyAction, setBusyAction] = useState(false);
    const [message, setMessage] = useState("");

    async function createInspection(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = new FormData(form);
        const evidence = fields.get("evidence");
        const body = {
            unitCode: fields.get("unitCode"),
            goodsCleared: fields.get("goodsCleared") === "on",
            cleanlinessStatus: fields.get("cleanlinessStatus"),
            repairFee: fields.get("repairFee"),
            damageNotes: fields.get("damageNotes"),
            lockDamaged: fields.get("lockDamaged") === "on",
        };
        const requiresEvidence = body.cleanlinessStatus === "NEEDS_CLEANING"
            || Number(body.repairFee) > 0
            || body.lockDamaged;
        if (requiresEvidence && !evidence?.size) {
            setMessage("Vui lòng đính kèm ảnh minh chứng khi cần vệ sinh hoặc sửa chữa.");
            return;
        }
        if (evidence?.size && (!["image/png", "image/jpeg"].includes(evidence.type) || evidence.size > 10 * 1024 * 1024)) {
            setMessage("Ảnh minh chứng phải là PNG/JPEG và không vượt quá 10 MB.");
            return;
        }
        setBusyAction(true);
        setMessage("");
        try {
            await rentalApi.inspect(body, evidence?.size ? evidence : null);
            setMessage("Đã gửi phiếu nghiệm thu và ảnh minh chứng cho khách hàng.");
            form.reset();
            reload();
        } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Không lập được phiếu nghiệm thu.");
        } finally {
            setBusyAction(false);
        }
    }

    async function completeInspection() {
        if (!contract) return;
        setBusyAction(true);
        setMessage("");
        try {
            await rentalApi.completeInspection(contract.id);
            setMessage("Đã hoàn tất nghiệm thu, kết thúc hợp đồng và tạo yêu cầu hoàn cọc.");
            reload();
        } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Không hoàn tất được nghiệm thu.");
        } finally {
            setBusyAction(false);
        }
    }

    const canDraft = session?.user?.role === "STAFF" && contract
        && String(contract.status).toUpperCase() === "CHECKOUT_REQUESTED"
        && !waitingStatuses.has(String(contract.inspectionStatus).toUpperCase())
        && !["COMPLETED", "CONFIRMED"].includes(String(contract.inspectionStatus).toUpperCase());

    if (!contractId) {
        return <main className="page-content return-inspection-page">
          <header className="page-heading">
            <div><span className="eyebrow">STAFF / CHECKOUT</span><h1>Yêu cầu trả kho</h1><p>Xem lịch hẹn trả và mở phiếu nghiệm thu cho từng hợp đồng.</p></div>
            <button className="secondary" type="button" onClick={reload}>Làm mới</button>
          </header>
          {error && <section className="card error" role="alert">{error}<button className="secondary" type="button" onClick={reload}>Thử lại</button></section>}
          {busy ? <section className="card empty">Đang tải yêu cầu trả kho…</section> : !requests.length ? <section className="card empty"><span className="empty-icon">↩</span><h2>Không có yêu cầu trả kho</h2><p>Hiện tại không có yêu cầu trả kho đang chờ xử lý.</p></section> : <>
            <div className="summary-grid inspection-summary">
              <article className="card"><span>Yêu cầu cần xử lý</span><strong>{requests.filter((row) => !row.inspectionStatus).length}</strong></article>
              <article className="card"><span>Chờ khách xác nhận</span><strong>{requests.filter((row) => row.inspectionStatus === "PENDING_CONFIRM").length}</strong></article>
              <article className="card"><span>Chờ Manager</span><strong>{requests.filter((row) => row.inspectionStatus === "PENDING_MANAGER").length}</strong></article>
            </div>
            <section className="card">
              <div className="table-toolbar"><h2>Danh sách yêu cầu <span className="count">{requests.length}</span></h2></div>
              <div className="table-scroll"><table><thead><tr><th>Hợp đồng</th><th>Khách hàng</th><th>Kho / cơ sở</th><th>Ngày hẹn trả</th><th>Trạng thái nghiệm thu</th><th></th></tr></thead>
                <tbody>{requests.map((row) => <tr key={String(row.id)}>
                  <td>{display(row.id)}</td><td>{display(row.customerName)}<br /><small>{display(row.customerPhone)}</small></td>
                  <td>{display(row.unitCode)}<br /><small>{display(row.facilityCode)}</small></td>
                  <td>{display(row.checkoutRequestedDate)}</td>
                  <td><span className={`badge ${row.inspectionStatus ? "pending" : ""}`}>{inspectionLabels[row.inspectionStatus] || "Chờ nghiệm thu"}</span></td>
                  <td><Link className="button secondary" to={`/facility/inspections/${encodeURIComponent(String(row.id))}`}>Xem chi tiết</Link></td>
                </tr>)}</tbody>
              </table></div>
            </section>
          </>}
        </main>;
    }

    return <main className="page-content return-inspection-page">
      <header className="page-heading">
        <div><span className="eyebrow">STAFF / CHECKOUT</span><h1>Chi tiết yêu cầu trả kho</h1><p>Kiểm tra tình trạng kho, lập phiếu và chờ khách xác nhận trước khi hoàn tất hợp đồng.</p></div>
        <Link className="button secondary" to="/facility/inspections">Về danh sách yêu cầu</Link>
      </header>
      {error && <section className="card error" role="alert">{error}<button className="secondary" type="button" onClick={reload}>Thử lại</button></section>}
      {busy && <section className="card empty">Đang tải chi tiết hợp đồng…</section>}
      {!busy && !contract && <section className="card empty"><h2>Không tìm thấy yêu cầu trả kho</h2><p>Yêu cầu có thể đã được xử lý hoặc không thuộc phạm vi của bạn.</p><Link className="button secondary" to="/facility/inspections">Quay lại danh sách</Link></section>}
      {contract && <>
        <section className="card inspection-request-card">
          <div className="inspection-card-heading"><div><span className="eyebrow">HỢP ĐỒNG {display(contract.id)}</span><h2>{display(contract.customerName)}</h2><p>{display(contract.facilityCode)} · Kho {display(contract.unitCode)}</p></div>
            <span className={`badge ${contract.inspectionStatus ? "pending" : ""}`}>{inspectionLabels[contract.inspectionStatus] || "Chờ nghiệm thu"}</span>
          </div>
          <dl className="summary-grid inspection-facts">
            <div><dt>Số điện thoại</dt><dd>{display(contract.customerPhone)}</dd></div>
            <div><dt>Ngày hẹn trả kho</dt><dd>{display(contract.checkoutRequestedDate)}</dd></div>
            <div><dt>Ngày kết thúc dự kiến</dt><dd>{display(contract.endAt || contract.endDate)}</dd></div>
            <div><dt>Tiền cọc</dt><dd>{money(contract.depositFee)}</dd></div>
          </dl>
          <div className="inspection-customer-reason"><strong>Lý do trả kho</strong><p>{display(contract.checkoutReason)}</p></div>
          {contract.inspectionStatus && <div className="inspection-current-offer"><strong>Phiếu nghiệm thu hiện tại</strong><span>Khấu trừ {money(contract.inspectionPenaltyFee)} · Hoàn cọc dự kiến {money(contract.inspectionRefundAmount)}</span>
            {contract.inspectionDamageNotes && <p>{display(contract.inspectionDamageNotes)}</p>}
            {contract.inspectionEvidenceAvailable && <InspectionEvidence contractId={contract.id} />}
          </div>}
          {contract.inspectionStatus === "CUSTOMER_ACCEPTED" && session?.user?.role === "STAFF" && <div className="inspection-next-action"><div><strong>Khách đã xác nhận phiếu</strong><p>Hoàn tất nghiệm thu để kết thúc hợp đồng và tạo yêu cầu hoàn cọc.</p></div><button type="button" disabled={busyAction} onClick={() => void completeInspection()}>{busyAction ? "Đang hoàn tất…" : "Hoàn tất nghiệm thu"}</button></div>}
          {contract.inspectionStatus === "PENDING_MANAGER" && <p className="notice">Khách đã gửi khiếu nại kèm minh chứng; đang chờ quản lý cơ sở xem xét.</p>}
          {contract.inspectionStatus === "PENDING_CUSTOMER" && <p className="notice">Đề xuất phí đã gửi khách hàng; chờ khách xác nhận hoặc gửi khiếu nại tiếp theo.</p>}
          {message && <p role="status" className={message.startsWith("Đã") ? "notice" : "error"}>{message}</p>}
        </section>
        {canDraft && <form className="card inspection-form" onSubmit={(event) => void createInspection(event)}>
          <div><span className="eyebrow">BIÊN BẢN HIỆN TRẠNG</span><h2>Lập phiếu nghiệm thu</h2><p>Ghi nhận tình trạng thực tế và đính kèm ảnh khi có vấn đề cần sửa chữa hoặc vệ sinh.</p></div>
          <input name="unitCode" type="hidden" value={contract.unitCode || ""} readOnly />
          <div className="inspection-form-grid">
            <label className="inspection-check"><input name="goodsCleared" type="checkbox" required /><span><strong>Đã dọn hết hàng hóa</strong><small>Xác nhận kho đã được khách bàn giao trống.</small></span></label>
            <label>Trạng thái vệ sinh<select name="cleanlinessStatus" defaultValue="CLEAN"><option value="CLEAN">Đã vệ sinh</option><option value="NEEDS_CLEANING">Cần vệ sinh</option></select></label>
            <label>Phụ phí sửa chữa / vệ sinh (VND)<input name="repairFee" type="number" min="0" step="1" defaultValue="0" /></label>
            <label className="inspection-check"><input name="lockDamaged" type="checkbox" /><span><strong>Khóa bị hư</strong><small>Đánh dấu nếu phát hiện hư hỏng khóa.</small></span></label>
            <label className="inspection-wide">Hiện trạng và hư hại<textarea name="damageNotes" required placeholder="Mô tả ngắn tình trạng kho khi nghiệm thu…" /></label>
            <label className="inspection-wide inspection-upload">Ảnh minh chứng (PNG/JPEG, tối đa 10 MB)
              <input name="evidence" type="file" accept="image/png,image/jpeg" />
              <small>Đính kèm ảnh nếu phát hiện hư hỏng hoặc cần vệ sinh.</small>
            </label>
          </div>
          {message && <p role="status" className={message.startsWith("Đã") ? "notice" : "error"}>{message}</p>}
          <div className="form-actions"><button disabled={busyAction}>{busyAction ? "Đang gửi…" : "Gửi phiếu cho khách xác nhận"}</button></div>
        </form>}
      </>}
    </main>;
}
