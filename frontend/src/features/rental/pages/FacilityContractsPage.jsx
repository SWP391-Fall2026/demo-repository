import { Link } from "react-router-dom";
import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { OfficeIcon } from "../../../shared/ui/office/OfficeUi";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";

const statuses = ["PENDING_PAYMENT", "PENDING_HANDOVER", "ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED", "TERMINATED", "CANCELLED"];

function ContractDetail({ contract }) {
  return (
    <div className="office-detail-layout">
      <dl className="office-detail-grid">
        <div><dt>Mã hợp đồng</dt><dd>{display(contract.id)}</dd></div>
        <div><dt>Kho</dt><dd>{display(contract.unitCode)}</dd></div>
        <div><dt>Khách hàng</dt><dd>{display(contract.customerName)}</dd></div>
        <div><dt>Điện thoại</dt><dd>{display(contract.customerPhone)}</dd></div>
        <div><dt>Cơ sở</dt><dd>{display(contract.facilityCode)}</dd></div>
        <div><dt>Trạng thái</dt><dd><span className="badge">{display(contract.status)}</span></dd></div>
        <div><dt>Bắt đầu</dt><dd>{display(contract.startDate || contract.startAt)}</dd></div>
        <div><dt>Kết thúc</dt><dd>{display(contract.endDate || contract.endAt)}</dd></div>
        <div><dt>Giá thuê / tháng</dt><dd>{money(contract.monthlyFee)}</dd></div>
        <div><dt>Tiền cọc</dt><dd>{money(contract.depositFee)}</dd></div>
        {contract.checkoutRequestedAt && <div><dt>Yêu cầu trả kho</dt><dd>{display(contract.checkoutRequestedAt)}</dd></div>}
      </dl>
      <nav className="office-actions" aria-label="Tác vụ hợp đồng">
        <Link className="button secondary" to="/facility/invoices"><OfficeIcon>receipt_long</OfficeIcon>Hóa đơn cơ sở</Link>
        {contract.status === "OVERDUE" && <Link className="button secondary" to="/facility/overdue"><OfficeIcon>warning</OfficeIcon>Xử lý quá hạn</Link>}
        {contract.status === "CHECKOUT_REQUESTED" && <Link className="button secondary" to="/handover-reviews"><OfficeIcon>fact_check</OfficeIcon>Yêu cầu bàn giao</Link>}
      </nav>
    </div>
  );
}

export default function FacilityContractsPage() {
  return (
    <ResourcePage
      title="Hợp đồng tại cơ sở"
      eyebrow="FACILITY MANAGER / HỢP ĐỒNG"
      description="Theo dõi hợp đồng, ngày hết hạn, yêu cầu trả kho và trường hợp quá hạn trong phạm vi cơ sở."
      load={rentalApi.list}
      searchPlaceholder="Tìm mã hợp đồng, mã kho hoặc khách hàng…"
      tableTitle="Danh sách hợp đồng"
      exportName="facility-contracts"
      filters={[{ key: "status", label: "Trạng thái", options: statuses }]}
      columns={[
        ["id", "Mã hợp đồng"],
        ["unitCode", "Mã kho"],
        ["customerName", "Khách hàng"],
        ["startDate", "Bắt đầu"],
        ["endDate", "Kết thúc"],
        ["status", "Trạng thái"],
      ]}
      renderDetail={(contract) => <ContractDetail contract={contract} />}
      detailTitle={(contract) => `Chi tiết hợp đồng: ${contract.id}`}
      metrics={(rows) => [
        { label: "Tổng hợp đồng", value: rows.length, icon: "description", tone: "blue" },
        { label: "Đang hiệu lực", value: rows.filter((row) => ["ACTIVE", "EXPIRING_SOON"].includes(row.status)).length, icon: "check_circle", tone: "green" },
        { label: "Quá hạn", value: rows.filter((row) => row.status === "OVERDUE").length, icon: "warning", tone: "amber" },
        { label: "Chờ trả kho", value: rows.filter((row) => row.status === "CHECKOUT_REQUESTED" || row.checkoutRequestedAt).length, icon: "assignment_return", tone: "navy" },
      ]}
    />
  );
}
