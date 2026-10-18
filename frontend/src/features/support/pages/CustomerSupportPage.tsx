import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { supportApi } from "../api/support.api";
export default function CustomerSupportPage() {
  return (
    <ResourcePage title="Yêu cầu hỗ trợ" description="" load={supportApi.list}>
      <Form
        fields={[
          { name: "unitCode", label: "Mã kho", type: "text", required: true },
          {
            name: "category",
            label: "Phân loại",
            type: "text",
            options: ["ACCESS", "DAMAGE", "PAYMENT", "OTHER"],
          },
          { name: "title", label: "Tiêu đề", type: "text", required: true },
          {
            name: "description",
            label: "Mô tả",
            type: "textarea",
            required: true,
          },
        ]}
        submit={supportApi.create}
      />
    </ResourcePage>
  );
}
