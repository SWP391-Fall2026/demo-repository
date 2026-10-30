import { ReportPage } from "../../../shared/ui/ReportPage";
import { reportingApi } from "../api/reporting.api";
import { facilityApi } from "../../facility/api/facility.api";
async function load(params) {
  const [report, facilities] = await Promise.all([
    reportingApi.chain(params),
    facilityApi.facilities(),
  ]);
  return {
    ...report,
    byFacility: (report.byFacility || []).map((row) => ({
      ...(facilities || []).find(
        (facility) => facility.code === row.facilityCode,
      ),
      ...row,
    })),
  };
}
export default function ChainDashboardPage() {
  return <ReportPage title="Tổng quan kinh doanh" mode="overview" load={load} />;
}
