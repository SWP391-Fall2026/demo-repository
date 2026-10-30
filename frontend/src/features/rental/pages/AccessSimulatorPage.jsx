import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function AccessSimulatorPage() {
    return (<ResourcePage title="Mô phỏng kiểm tra PIN" description="Chỉ kiểm tra quyền truy cập trên phần mềm, không kết nối khóa vật lý." load={rentalApi.list}>
      <Form fields={[
            { name: "unitCode", label: "Mã kho", type: "text", required: true },
            { name: "pin", label: "PIN 6 chữ số", type: "text", required: true },
        ]} submit={rentalApi.verifyPin}/>
    </ResourcePage>);
}
