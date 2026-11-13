import { RevenueReport } from "./RevenueReport";
import { useSession } from "../../identity/session";
export default function FacilityReportPage() {
    const session = useSession();
    return <RevenueReport title="Báo cáo cơ sở" fixedFacility={session?.user?.facilityCode} />;
}
