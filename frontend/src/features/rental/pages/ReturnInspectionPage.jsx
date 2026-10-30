import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function ReturnInspectionPage() {
    return (<ResourcePage title="Nghiệm thu trả kho" description="" load={rentalApi.list}>
      <Form fields={[
            { name: "unitCode", label: "Mã kho", type: "text", required: true },
            {
                name: "cleanlinessStatus",
                label: "Vệ sinh",
                type: "text",
                options: ["CLEAN", "NEEDS_CLEANING"],
            },
            {
                name: "damageNotes",
                label: "Hiện trạng và hư hỏng",
                type: "textarea",
                required: true,
            },
            { name: "lockDamaged", label: "Khóa bị hư", type: "checkbox" },
        ]} submit={rentalApi.inspect}/>
    </ResourcePage>);
}
