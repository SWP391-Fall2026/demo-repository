import { request, json } from "../../../shared/api/http-client";
export const supportApi = {
    list: () => request("/tickets"),
    create: (d) => request("/tickets", json("POST", d)),
    progress: (d) => request(`/tickets/${d.id}`, json("PATCH", d)),
};
