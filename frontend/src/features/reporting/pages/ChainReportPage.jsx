import { ReportPage } from "../../../shared/ui/ReportPage";
import { reportingApi } from "../api/reporting.api";
export default function ChainReportPage() {
  return (
    <ReportPage
      title="Báo cáo tổng hợp kinh doanh"
      mode="report"
      load={reportingApi.chain}
    />
  );
}
