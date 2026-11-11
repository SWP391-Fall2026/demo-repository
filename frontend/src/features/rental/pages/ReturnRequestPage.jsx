import { useSearchParams } from "react-router-dom";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function ReturnRequestPage() {
    const [params] = useSearchParams();
    const prefilledContractId = params.get("contractId") || "";
    const today = new Date().toISOString().slice(0, 10);
    return (<ResourcePage eyebrow="STORAGE / TRẢ KHO" title="Yêu cầu trả kho" description="Khách hàng gửi yêu cầu trả kho, chọn ngày hẹn thực tế để nhân viên hỗ trợ kiểm tra buồng kho và làm thủ tục nghiệm thu." load={rentalApi.list} columns={[
            ["id", "Mã hợp đồng"],
            ["unitCode", "Kho thuê"],
            ["facilityCode", "Cơ sở"],
            ["status", "Trạng thái"],
            ["endAt", "Ngày kết thúc dự kiến"],
        ]}>
      <Form key={prefilledContractId || "new-return"} label="Gửi yêu cầu trả kho" fields={[
            {
                name: "contractId",
                label: "Mã hợp đồng",
                type: "text",
                defaultValue: prefilledContractId,
                required: true,
            },
            {
                name: "requestedDate",
                label: "Ngày hẹn trả kho thực tế",
                type: "date",
                defaultValue: today,
                required: true,
            },
            {
                name: "reason",
                label: "Lý do kết thúc thuê",
                type: "textarea",
                required: true,
            },
        ]} submit={rentalApi.returnRequest}/>
    </ResourcePage>);
}
