import { request, json } from "../../../shared/api/http-client";
export const workforceApi = {
    list: () => request("/tasks"),
    staffOptions: () => request("/tasks/staff-options"),
    managerDashboard: () => request("/tasks/manager-dashboard"),
    assign: (d) => request("/tasks/dispatch", json("POST", d)),
    assignExisting: (id, d) => request(`/tasks/${id}/assign`, json("PATCH", d)),
    credentials: (id) => request(`/tasks/${id}/checkin/credentials`),
    verifyCheckin: (id, d) => request(`/tasks/${id}/checkin/verify`, json("POST", d)),
    progress: (d) => request(`/tasks/${d.id}/status`, json("PATCH", d)),
};
