import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const reservationApi = {
  list: () => request<Row[]>("/reservations"),
  get: (id: string) => request<Row>(`/reservations/${encodeURIComponent(id)}`),
  requestCheckin: (id: string) => request<Row>(`/reservations/${encodeURIComponent(id)}/checkin-request`, json("POST", {})),
  checkinTask: (id: string) => request<Row>(`/reservations/${encodeURIComponent(id)}/checkin-task`),
  contractOffer: (id: string) => request<Row>(`/reservations/${encodeURIComponent(id)}/contract-offer`),
  acceptTerms: (id: string, termsVersion: string) => request<Row>(`/reservations/${encodeURIComponent(id)}/contract-terms/accept`, json("POST", { accepted: true, termsVersion })),
  create: (d: Row) => request<Row>("/reservations", json("POST", d)),
  quote: (d: Row) => request<Row>("/reservations/calculate", json("POST", d)),
  assign: (d: Row) =>
    request(`/reservations/${d.reservationId}/assign-unit`, json("PATCH", d)),
  cancel: (d: Row) =>
    request(`/reservations/${d.reservationId}/cancel`, json("POST", d)),
  arrived: (d: Row) =>
    request(`/reservations/${d.reservationId}/arrived`, json("POST", d)),
  incident: (d: Row) =>
    request(`/reservations/${d.reservationId}/incident`, json("POST", d)),
  noShow: (d: Row) =>
    request(`/reservations/${d.reservationId}/no-show`, json("POST", d)),
  extend: (d: Row) =>
    request(`/reservations/${d.reservationId}/extension`, json("POST", d)),
  reschedule: (d: Row) =>
    request(`/reservations/${d.reservationId}/schedule`, json("POST", d)),
};
