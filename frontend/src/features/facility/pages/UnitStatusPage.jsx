import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
export default function UnitStatusPage() {
    return (<ResourcePage title="Tình trạng và vệ sinh kho" description="Staff xác nhận vệ sinh hoàn tất và gửi Manager duyệt. Không tự chuyển kho sang AVAILABLE." load={facilityApi.managedUnits}>
      <Form fields={[
            { name: "code", label: "Mã kho", type: "text", required: true },
            {
                name: "notes",
                label: "Ghi nhận vệ sinh",
                type: "textarea",
                required: true,
            },
        ]} submit={facilityApi.ready}/>
    </ResourcePage>);
}
