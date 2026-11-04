import { useEffect, useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";

function DisputeEvidence({ id }) {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        let objectUrl = "";
        rentalApi.loadReturnInspectionEvidence(id).then((value) => {
            objectUrl = value;
            if (active)
                setUrl(value);
            else
                URL.revokeObjectURL(value);
        }).catch(() => {
            if (active) {
                setUrl("");
                setError("Không tải được ảnh minh chứng khiếu nại.");
            }
        });
        return () => {
            active = false;
            if (objectUrl)
                URL.revokeObjectURL(objectUrl);
        };
    }, [id]);
    if (error)
        return <p className="error" role="alert">{error}</p>;
    return url ? <img src={url} alt="Ảnh minh chứng khách hàng gửi" /> : <p>Đang tải ảnh minh chứng…</p>;
}

function InspectionEvidence({ contractId }) {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        let objectUrl = "";
        rentalApi.loadInspectionEvidence(contractId).then((value) => {
            objectUrl = value;
            if (active)
                setUrl(value);
            else
                URL.revokeObjectURL(value);
        }).catch(() => {
            if (active) {
                setUrl("");
                setError("Không tải được ảnh Staff đính kèm phiếu.");
            }
        });
        return () => {
            active = false;
            if (objectUrl)
                URL.revokeObjectURL(objectUrl);
        };
    }, [contractId]);
    if (error)
        return <p className="error" role="alert">{error}</p>;
    return url ? <img className="inspection-evidence" src={url} alt="Ảnh Staff đính kèm phiếu nghiệm thu" /> : <p>Đang tải ảnh phiếu nghiệm thu…</p>;
}

export default function ReturnInspectionReviewPage() {
    const { data, error, busy, reload } = useRemote(rentalApi.returnInspectionReviews);
    const [saving, setSaving] = useState("");
    const [message, setMessage] = useState("");
    const rows = Array.isArray(data) ? data : [];

    async function decide(event, dispute) {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        setSaving(String(dispute.id));
        setMessage("");
        try {
            await rentalApi.decideReturnInspectionReview(dispute.id, {
                proposedDeduction: Number(fields.get("proposedDeduction")),
                managerNote: fields.get("managerNote"),
            });
            setMessage("Đã gửi đề xuất khấu trừ cho khách hàng.");
            reload();
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : "Không gửi được quyết định.");
        }
        finally {
            setSaving("");
        }
    }

    return <main className="page-content">
      <header className="page-heading"><div><span className="eyebrow">STORAGE / NGHIỆM THU TRẢ KHO</span><h1>Khiếu nại nghiệm thu</h1><p>Xem lý do và ảnh minh chứng; đề xuất mức khấu trừ mới không cao hơn mức ban đầu của Staff.</p></div><button className="secondary" onClick={reload}>Làm mới</button></header>
      {message && <p className="card notice" role="status">{message}</p>}
      {error && <p className="card error" role="alert">{error}</p>}
      {busy && <p>Đang tải yêu cầu…</p>}
      {!busy && !rows.length && <section className="card empty"><span className="empty-icon">✓</span><h2>Chưa có khiếu nại nghiệm thu</h2><p>Các yêu cầu khách hàng gửi sẽ xuất hiện tại đây.</p></section>}
      <div className="review-dispute-grid">
        {rows.map((dispute) => <article className="card review-dispute-card" key={String(dispute.id)}>
          <header><div><span className="eyebrow">YÊU CẦU {display(dispute.id)}</span><h2>Hợp đồng {display(dispute.contractId)}</h2></div><span className={`badge ${dispute.status === "PENDING_MANAGER" ? "pending" : "success"}`}>{display(dispute.status)}</span></header>
          <div className="review-dispute-body">
            <section>
              <dl className="review-dispute-facts">
                <div><dt>Cơ sở / kho</dt><dd>{display(dispute.facilityCode)} · {display(dispute.unitCode)}</dd></div>
                <div><dt>Tiền cọc</dt><dd>{money(dispute.depositAmount)}</dd></div>
                <div><dt>Khấu trừ hiện tại</dt><dd>{money(dispute.currentDeduction)}</dd></div>
                <div><dt>Mức tối đa theo phiếu gốc</dt><dd>{money(dispute.maximumDeduction)}</dd></div>
              </dl>
              <div className="review-dispute-reason"><strong>Lý do khách hàng không đồng ý</strong><p>{display(dispute.reason)}</p></div>
              <p>Phí sửa chữa: {money(dispute.repairFee)} · Vệ sinh: {display(dispute.cleanlinessStatus)}</p>
              <p>Hiện trạng Staff: {display(dispute.damageNotes)}</p>
              {dispute.managerNote && <p className="notice">Ghi chú xử lý trước: {display(dispute.managerNote)}</p>}
              {dispute.status === "OFFERED" && <p className="notice">Đã đề xuất khấu trừ {money(dispute.proposedDeduction)}; đang chờ khách xác nhận hoặc gửi khiếu nại tiếp theo.</p>}
            </section>
            <section className="review-dispute-evidence">
              {dispute.inspectionEvidenceAvailable && <div><strong>Ảnh Staff đính kèm phiếu</strong><InspectionEvidence contractId={dispute.contractId} /></div>}
              <div><strong>Ảnh minh chứng khách hàng</strong><DisputeEvidence id={dispute.id} /></div>
              {dispute.status === "PENDING_MANAGER" && <form className="review-decision-form" onSubmit={(event) => void decide(event, dispute)}>
                <h3>Gửi đề xuất mức khấu trừ</h3>
                <label>Mức khấu trừ đề xuất (VND)
                  <input name="proposedDeduction" type="number" min="0" max={Number(dispute.maximumDeduction)} step="1" defaultValue={Number(dispute.maximumDeduction || 0)} required />
                </label>
                <label>Giải thích gửi khách hàng<textarea name="managerNote" required /></label>
                <button disabled={saving === String(dispute.id)}>{saving === String(dispute.id) ? "Đang gửi…" : "Gửi đề xuất cho khách"}</button>
              </form>}
            </section>
          </div>
        </article>)}
      </div>
    </main>;
}
