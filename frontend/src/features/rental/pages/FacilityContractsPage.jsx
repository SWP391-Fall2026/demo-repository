import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";

const contractColumns = [
    ["id", "Mã hợp đồng"],
    ["customerName", "Khách hàng"],
    ["unitCode", "Kho lưu trữ"],
    ["facilityCode", "Cơ sở"],
    ["monthlyFee", "Giá thuê / tháng"],
    ["startDate", "Ngày bắt đầu"],
    ["endDate", "Ngày kết thúc"],
    ["status", "Trạng thái hợp đồng"],
];

export default function FacilityContractsPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / QUẢN LÝ HỢP ĐỒNG"
            title="Hợp đồng thuê kho tại cơ sở"
            description="Danh sách hợp đồng thuê kho đang hoạt động, sắp hết hạn hoặc đang làm thủ tục bàn giao, trả kho tại chi nhánh."
            load={rentalApi.list}
            columns={contractColumns}
        />
    );
}
