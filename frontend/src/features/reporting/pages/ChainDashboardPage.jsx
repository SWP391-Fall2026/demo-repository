import { ReportPage } from "../../../shared/ui/ReportPage";
import { reportingApi } from "../api/reporting.api";
export default function ChainDashboardPage() {
    return (<ReportPage title="Tổng quan vận hành toàn chuỗi" load={reportingApi.chain}/>);
}
