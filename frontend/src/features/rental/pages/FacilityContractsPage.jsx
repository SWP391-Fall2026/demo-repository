import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function FacilityContractsPage() {
    return (<ResourcePage title="Hợp đồng tại cơ sở" description="" load={rentalApi.list}></ResourcePage>);
}
