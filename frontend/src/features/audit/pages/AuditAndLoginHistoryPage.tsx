import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { auditApi } from "../api/audit.api";
export default function AuditAndLoginHistoryPage() {
  return (
    <ResourcePage
      title="Nhật ký hoạt động"
      description=""
      load={auditApi.list}
    ></ResourcePage>
  );
}
