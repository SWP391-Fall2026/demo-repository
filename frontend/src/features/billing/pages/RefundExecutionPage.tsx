import { useState, type FormEvent } from "react";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { billingApi } from "../api/billing.api";
export default function RefundExecutionPage() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget),
      file = d.get("file") as File;
    setBusy(true);
    try {
      await billingApi.upload(
        String(d.get("id")),
        file,
        String(d.get("reference")),
      );
      setMessage("Đã tải bằng chứng. Chờ Facility Manager xác nhận.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ResourcePage title="Bằng chứng hoàn tiền" load={billingApi.refunds}>
      <h3>Tạo thay khách khi có căn cứ</h3>
      <Form
        fields={[
          { name: "paymentId", label: "Giao dịch gốc", required: true },
          { name: "amount", label: "Số tiền", type: "number", required: true },
          {
            name: "reason",
            label: "Lý do hoàn",
            type: "textarea",
            required: true,
          },
          {
            name: "onBehalfBasis",
            label: "Căn cứ khách đồng ý / sự cố khiến khách không thể thao tác",
            type: "textarea",
            required: true,
          },
          {
            name: "exceptionRequested",
            label: "Yêu cầu ngoại lệ",
            type: "checkbox",
          },
        ]}
        submit={billingApi.requestRefund}
      />
      <h3>Bằng chứng chuyển tiền sau phê duyệt</h3>
      <form className="form-grid" onSubmit={submit}>
        <label>
          Mã yêu cầu
          <input name="id" required />
        </label>
        <label>
          Mã giao dịch chuyển tiền
          <input name="reference" required />
        </label>
        <label>
          Bằng chứng PNG/JPEG/PDF
          <input
            name="file"
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            required
          />
        </label>
        <button disabled={busy}>Tải bằng chứng</button>
        <p role="status">{message}</p>
      </form>
    </ResourcePage>
  );
}
