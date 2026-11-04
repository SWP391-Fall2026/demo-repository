import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";

export default function PricingPolicyPage() {
    return (<ResourcePage title="Quản lý giá & chính sách" description="Xem cấu hình giá toàn chuỗi và cập nhật giá riêng theo cơ sở. Mức giá mới chỉ áp dụng cho reservation mới." load={policyApi.get} childrenTitle="Cập nhật giá và chính sách">
      <div className="policy-config-grid">
      <section className="policy-config-section"><h3>Giá riêng theo cơ sở</h3><p>Giá tại cơ sở ghi đè giá toàn chuỗi cho đơn mới.</p><Form label="Lưu giá riêng tại cơ sở" fields={[
            { name: "facilityCode", label: "Mã cơ sở", type: "text", required: true },
            { name: "unitType", label: "Loại kho", options: ["S", "M", "L", "CLIMATE"], required: true },
            { name: "pricePerMonth", label: "Giá thuê mỗi tháng (VND)", type: "number", required: true },
        ]} submit={policyApi.saveFacilityPrice}/>
      </section>
      <section className="policy-config-section"><h3>Giá chuẩn / chính sách</h3><p>Giá và thời hạn được snapshot cho reservation mới.</p><Form label="Lưu thay đổi" fields={[
            {
                name: "key",
                label: "Khóa chính sách / giá chuẩn / phụ phí",
                type: "text",
                required: true,
            },
            { name: "value", label: "Giá trị", type: "number", required: true },
        ]} submit={policyApi.save}/>
      </section>
      </div>
      <PolicyHistory />
    </ResourcePage>);
}

function PolicyHistory() {
    const history = useRemote(policyApi.history);
    const rows = Array.isArray(history.data) ? history.data : [];
    if (history.busy) return <p>Đang tải lịch sử…</p>;
    if (history.error) return <p className="error">{history.error}</p>;
    if (!rows.length) return <p>Chưa có lần đổi chính sách nào.</p>;
    return (
        <div className="table-scroll">
            <h3>Lịch sử hiệu lực (audit UPDATE_POLICY)</h3>
            <table>
                <thead><tr><th>Thời gian</th><th>Chính sách</th><th>Giá trị cũ → mới</th><th>Người đổi</th></tr></thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={String(r.id)}>
                            <td>{display(r.createdAt ?? r.timeStr)}</td>
                            <td>{display(r.entityId)}</td>
                            <td>{display(r.detail)}</td>
                            <td>{display(r.userName)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
