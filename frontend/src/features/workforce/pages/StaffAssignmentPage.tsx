import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { workforceApi } from "../api/workforce.api";
export default function StaffAssignmentPage() {
  return (
    <ResourcePage
      title="Phân công nhân viên"
      description=""
      load={workforceApi.list}
    >
      <Form
        fields={[
          {
            name: "title",
            label: "Nội dung công việc",
            type: "text",
            required: true,
          },
          {
            name: "staffId",
            label: "Mã nhân viên",
            type: "text",
            required: true,
          },
          {
            name: "taskType",
            label: "Loại việc",
            type: "text",
            options: ["CHECKIN", "RETURN", "SUPPORT", "MAINTENANCE"],
          },
          { name: "unitCode", label: "Mã kho", type: "text" },
          {
            name: "date",
            label: "Ngày thực hiện",
            type: "date",
            required: true,
          },
        ]}
        submit={workforceApi.assign}
      />
    </ResourcePage>
  );
}
