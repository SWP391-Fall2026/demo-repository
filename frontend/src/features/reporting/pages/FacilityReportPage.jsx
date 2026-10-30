import { ReportPage } from "../../../shared/ui/ReportPage";
import { reportingApi } from "../api/reporting.api";
export default function FacilityReportPage() {
    return <ReportPage title="Báo cáo cơ sở" load={reportingApi.facility}/>;
}
