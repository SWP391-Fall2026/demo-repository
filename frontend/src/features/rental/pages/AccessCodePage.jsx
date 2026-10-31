import { useState } from "react";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function AccessCodePage() {
    const [verified, setVerified] = useState(null);
    return (<ResourcePage title="Tra cứu mã truy cập điện tử" description="Hệ thống hiển thị mã PIN 6 số dùng để mở khóa kho/cửa ra vào cơ sở, kèm hướng dẫn an ninh. Kho đang trong trạng thái tạm khóa nợ cước thì PIN bị hạn chế." load={rentalApi.list}>
      <Form label="Kiểm tra quyền mở khóa" fields={[
            { name: "unitCode", label: "Mã kho", type: "text", required: true },
            { name: "pin", label: "PIN 6 chữ số", type: "text", required: true },
        ]} submit={async (body) => {
            const response = await rentalApi.verifyPin(body);
            setVerified(response);
            return response;
        }}/>
      {verified && (<p role="status">{verified.authorized ? "PIN hợp lệ: được phép mở khóa." : `PIN không có quyền mở khóa (${verified.reason || "từ chối"}).`}</p>)}
    </ResourcePage>);
}
