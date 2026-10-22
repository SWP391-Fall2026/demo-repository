import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
export default function UnitReadinessApprovalPage() {
    return (<ResourcePage title="Duyệt kho sẵn sàng" description="" load={facilityApi.managedUnits}>
      <Form fields={[
            { name: "code", label: "Mã kho", type: "text", required: true },
            {
                name: "reason",
                label: "Lý do/xác nhận kiểm tra",
                type: "textarea",
                required: true,
            },
        ]} submit={facilityApi.approveReady}/>
    </ResourcePage>);
}
