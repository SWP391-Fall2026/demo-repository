import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { supportApi } from "../api/support.api";
export default function IncidentDeskPage() {
  return (
    <ResourcePage title="Tiếp nhận sự cố" description="" load={supportApi.list}>
      <Form
        fields={[
          { name: "id", label: "Mã phiếu", type: "text", required: true },
          {
            name: "status",
            label: "Tiến độ",
            type: "text",
            options: ["IN_PROGRESS", "RESOLVED"],
          },
          {
            name: "notes",
            label: "Ghi chú xử lý",
            type: "textarea",
            required: true,
          },
        ]}
        submit={supportApi.progress}
      />
    </ResourcePage>
  );
}
