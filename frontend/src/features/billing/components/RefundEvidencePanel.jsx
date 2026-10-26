import { useEffect, useRef, useState } from "react";
import { billingApi } from "../api/billing.api";

export default function RefundEvidencePanel({ refundId }) {
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const resource = useRef(null);
    const active = useRef(true);
    useEffect(() => {
        active.current = true;
        return () => { active.current = false; if (resource.current) URL.revokeObjectURL(resource.current); };
    }, []);
    async function open() {
        setBusy(true); setError("");
        try {
            const result = await billingApi.loadRefundEvidence(refundId);
            if (!active.current) { URL.revokeObjectURL(result.url); return; }
            if (resource.current) URL.revokeObjectURL(resource.current);
            resource.current = result.url; setFile(result);
        } catch (cause) { if (active.current) setError(cause.message); }
        finally { if (active.current) setBusy(false); }
    }
    return <section className="refund-evidence-review"><h3>Bằng chứng chuyển tiền</h3>
      {!file && <button className="secondary" disabled={busy} onClick={() => void open()}>{busy ? "Đang tải bằng chứng…" : "Xem bằng chứng"}</button>}
      {error && <p className="error" role="alert">{error}</p>}
      {file && <><p><a href={file.url} target="_blank" rel="noreferrer">Mở bằng chứng trong tab mới</a> · <a href={file.url} download={`bang-chung-hoan-tien${file.contentType === "application/pdf" ? ".pdf" : file.contentType === "image/png" ? ".png" : ".jpg"}`}>Tải bằng chứng</a></p>
        {file.contentType === "application/pdf" ? <iframe title={`Bằng chứng hoàn tiền ${refundId}`} src={file.url} style={{width:"100%",height:540,border:"1px solid #dbe4ef"}}/> : <img src={file.url} alt={`Bằng chứng chuyển tiền của yêu cầu ${refundId}`} style={{display:"block",maxWidth:"100%",maxHeight:600,objectFit:"contain"}}/>}</>}
    </section>;
}
