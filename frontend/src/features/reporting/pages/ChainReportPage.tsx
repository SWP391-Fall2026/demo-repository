import { ReportPage } from "../../../shared/ui/ReportPage";
import { reportingApi } from "../api/reporting.api";
export default function ChainReportPage() {
  return <ReportPage title="Báo cáo toàn hệ thống" load={reportingApi.chain} />;
}
