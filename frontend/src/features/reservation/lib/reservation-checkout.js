import { reservationApi } from "../api/reservation.api";
import { billingApi } from "../../billing/api/billing.api";

// Keep the committed reservation when only the invoice lookup needs retrying.
export function createReservationCheckout() {
    let reservation;
    return async (payload, onCreated) => {
        if (!reservation) {
            reservation = await reservationApi.create(payload);
            onCreated?.(reservation);
        }
        const invoices = await billingApi.invoices();
        const invoice = invoices.find(item => item.reservationId === reservation.id && item.invoiceType === "DEPOSIT");
        if (!invoice?.id) throw new Error("Đơn đã tạo nhưng chưa tìm thấy hóa đơn đặt cọc.");
        return { reservation, invoice };
    };
}
