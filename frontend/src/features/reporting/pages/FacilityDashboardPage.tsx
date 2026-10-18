import { ReportPage } from "../../../shared/ui/ReportPage";
import { reportingApi } from "../api/reporting.api";
export default function FacilityDashboardPage() {
  return (
    <ReportPage title="Tổng quan chi nhánh" load={reportingApi.facility} />
  );
}
