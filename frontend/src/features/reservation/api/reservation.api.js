import { request, json } from "../../../shared/api/http-client";
export const reservationApi = {
    list: () => request("/reservations"),
    get: (id) => request(`/reservations/${encodeURIComponent(id)}`),
    requestCheckin: (id) => request(`/reservations/${encodeURIComponent(id)}/checkin-request`, json("POST", {})),
    checkinTask: (id) => request(`/reservations/${encodeURIComponent(id)}/checkin-task`),
    contractOffer: (id) => request(`/reservations/${encodeURIComponent(id)}/contract-offer`),
    acceptTerms: (id, termsVersion) => request(`/reservations/${encodeURIComponent(id)}/contract-terms/accept`, json("POST", { accepted: true, termsVersion })),
    create: (d) => request("/reservations", json("POST", d)),
    quote: (d) => request("/reservations/calculate", json("POST", d)),
    assign: (d) => request(`/reservations/${d.reservationId}/assign-unit`, json("PATCH", d)),
    cancel: (d) => request(`/reservations/${d.reservationId}/cancel`, json("POST", d)),
    arrived: (d) => request(`/reservations/${d.reservationId}/arrived`, json("POST", d)),
    incident: (d) => request(`/reservations/${d.reservationId}/incident`, json("POST", d)),
    noShow: (d) => request(`/reservations/${d.reservationId}/no-show`, json("POST", d)),
    extend: (d) => request(`/reservations/${d.reservationId}/extension`, json("POST", d)),
    reschedule: (d) => request(`/reservations/${d.reservationId}/schedule`, json("POST", d)),
};
