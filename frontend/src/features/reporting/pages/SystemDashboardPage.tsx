import { ReportPage } from "../../../shared/ui/ReportPage";
import { reportingApi } from "../api/reporting.api";
export default function SystemDashboardPage() {
  return <ReportPage title="Tổng quan hệ thống" load={reportingApi.system} />;
}
