import { useEffect, useState } from "react";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";

function DisputeEvidence({ review }) {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        let objectUrl = "";
        rentalApi.loadReturnInspectionEvidence(review.id).then((value) => {
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
    }, [review.id]);
    if (error)
        return <p className="error" role="alert">{error}</p>;
    return url ? <img className="inspection-evidence" src={url} alt="Ảnh minh chứng khiếu nại nghiệm thu" /> : <p>Đang tải ảnh minh chứng…</p>;
}

export default function ReturnInspectionResponse({ contractId, status, reviews, evidenceAvailable, onUpdated }) {
    const [reason, setReason] = useState("");
    const [evidence, setEvidence] = useState(null);
    const [inspectionImageUrl, setInspectionImageUrl] = useState("");
    const [inspectionImageError, setInspectionImageError] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const canRespond = ["PENDING_CONFIRM", "PENDING_CUSTOMER"].includes(String(status));

    useEffect(() => {
        let active = true;
        let url = "";
        if (evidenceAvailable) {
            rentalApi.loadInspectionEvidence(contractId).then((value) => {
                url = value;
                if (active)
                    setInspectionImageUrl(value);
                else
                    URL.revokeObjectURL(value);
            }).catch(() => {
                if (active) {
                    setInspectionImageUrl("");
                    setInspectionImageError("Không tải được ảnh Staff đính kèm phiếu.");
                }
            });
        } else {
            setInspectionImageUrl("");
            setInspectionImageError("");
        }
        return () => {
            active = false;
            if (url)
                URL.revokeObjectURL(url);
        };
    }, [contractId, evidenceAvailable]);

    async function respond(action, event) {
        event?.preventDefault();
        setBusy(true);
        setError("");
        try {
            await rentalApi.respondInspection(contractId, action, reason, evidence);
            setReason("");
            setEvidence(null);
            onUpdated?.();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Không gửi được phản hồi nghiệm thu.");
        }
        finally {
            setBusy(false);
        }
    }

    const reviewHistory = Array.isArray(reviews) ? reviews : reviews ? [reviews] : [];
    const review = reviewHistory[0];
    return <section className="customer-inspection-panel">
      {inspectionImageError && <p className="error" role="alert">{inspectionImageError}</p>}
      {inspectionImageUrl && <section className="customer-inspection-evidence"><h3>Ảnh hiện trạng trong phiếu Staff</h3><img className="inspection-evidence" src={inspectionImageUrl} alt="Ảnh hiện trạng kho khi nghiệm thu" /></section>}
      {reviewHistory.map((entry) => <section className="customer-review-history" key={String(entry.id)}>
        <strong>Yêu cầu xem xét · {display(entry.status)} · {display(entry.createdAt)}</strong>
        <p>{display(entry.reason)}</p>
        {entry.managerNote && <p>Phản hồi Manager: {display(entry.managerNote)}</p>}
        {entry.proposedDeduction != null && <p>Mức khấu trừ được đề xuất: {money(entry.proposedDeduction)}</p>}
        <DisputeEvidence review={entry} />
      </section>)}
      {canRespond && <>
        <p className="inspection-response-prompt">{status === "PENDING_CUSTOMER"
            ? "Manager đã gửi đề xuất mức khấu trừ mới. Bạn có thể xác nhận hoặc tiếp tục khiếu nại kèm ảnh."
            : "Vui lòng xác nhận phiếu hoặc gửi yêu cầu xem xét đến quản lý cơ sở."}</p>
        <div className="inspection-response-actions"><button type="button" disabled={busy} onClick={(event) => void respond("ACCEPT", event)}>
          {busy ? "Đang gửi…" : status === "PENDING_CUSTOMER" ? "Đồng ý đề xuất của Manager" : "Đồng ý phiếu nghiệm thu"}
        </button></div>
        <form className="form-grid inspection-dispute-form" onSubmit={(event) => void respond("DISPUTE", event)}>
          <label>Lý do không đồng ý
            <textarea required value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <label>Ảnh minh chứng (PNG/JPEG, tối đa 10 MB)
            <input required type="file" accept="image/png,image/jpeg" onChange={(event) => setEvidence(event.target.files?.[0] || null)} />
          </label>
          {error && <p role="alert" className="error">{error}</p>}
          <button type="submit" disabled={busy || !evidence}>{busy ? "Đang gửi…" : "Không đồng ý, gửi Manager xem xét"}</button>
        </form>
      </>}
      {status === "PENDING_MANAGER" && <p className="notice">Khiếu nại đã gửi kèm ảnh minh chứng và đang chờ Manager cơ sở xem xét.</p>}
      {status === "CUSTOMER_ACCEPTED" && <p className="notice">Bạn đã xác nhận. Staff sẽ hoàn tất nghiệm thu và tạo yêu cầu hoàn cọc.</p>}
    </section>;
}
