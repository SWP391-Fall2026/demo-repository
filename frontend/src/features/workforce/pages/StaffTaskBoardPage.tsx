import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { workforceApi } from "../api/workforce.api";
export default function StaffTaskBoardPage() {
  return (
    <ResourcePage
      title="Công việc của tôi"
      description=""
      load={workforceApi.list}
    >
      <Form
        fields={[
          { name: "id", label: "Mã công việc", type: "text", required: true },
          {
            name: "status",
            label: "Trạng thái mới",
            type: "text",
            options: ["IN_PROGRESS", "COMPLETED"],
          },
        ]}
        submit={workforceApi.progress}
      />
    </ResourcePage>
  );
}
