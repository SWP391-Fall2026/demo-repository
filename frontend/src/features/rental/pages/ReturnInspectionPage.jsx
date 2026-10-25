import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function ReturnInspectionPage() {
    return (<ResourcePage title="Nghiệm thu trả kho" description="Staff mở yêu cầu trả kho, cùng khách kiểm tra: hàng hóa đã dọn sạch chưa, vách/cửa có hư hại không, thu hồi thẻ/ổ khóa. Kho bị hư hại hoặc đồ đạc chưa dọn hết thì chưa hoàn tất; phụ phí sửa chữa/vệ sinh được ghi nhận theo chính sách." load={rentalApi.list} columns={[
            ["id", "Mã hợp đồng"],
            ["unitCode", "Mã kho"],
            ["status", "Trạng thái"],
            ["checkoutRequestedDate", "Ngày hẹn trả"],
            ["checkoutReason", "Lý do trả kho"],
        ]}>
      <Form label="Lập phiếu nghiệm thu bàn giao trả" fields={[
            { name: "unitCode", label: "Mã kho", type: "text", required: true },
            {
                name: "goodsCleared",
                label: "Hàng hóa đã dọn sạch",
                type: "checkbox",
                required: true,
            },
            {
                name: "cleanlinessStatus",
                label: "Vệ sinh",
                type: "text",
                options: ["CLEAN", "NEEDS_CLEANING"],
            },
            {
                name: "repairFee",
                label: "Phụ phí sửa chữa/vệ sinh (VND)",
                type: "number",
            },
            {
                name: "damageNotes",
                label: "Hiện trạng và hư hại",
                type: "textarea",
                required: true,
            },
            { name: "lockDamaged", label: "Khóa bị hư / thu hồi thẻ-ổ khóa", type: "checkbox" },
        ]} submit={rentalApi.inspect}/>
    </ResourcePage>);
}
