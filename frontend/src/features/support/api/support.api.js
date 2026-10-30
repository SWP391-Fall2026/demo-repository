import { request, json } from "../../../shared/api/http-client";
import { sessionStore } from "../../identity/session";
export const supportApi = {
    list: () => request("/tickets"),
    create: (d) => request("/tickets", json("POST", d)),
    progress: (d) => request(`/tickets/${d.id}`, json("PATCH", d)),
    uploadAttachment: async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return request("/tickets/upload", {
            method: "POST",
            body: formData,
        });
    },
    closeTicket: (id, rating, feedback) => request(`/tickets/${id}`, json("PATCH", {
        status: "CLOSED",
        rating,
        notes: feedback,
    })),
    openAttachment: async (url) => {
        if (!/^\/api\/files\/[a-zA-Z0-9.-]+$/.test(url)) throw new Error("Đường dẫn ảnh không hợp lệ.");
        const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
        const token = sessionStore.get()?.token;
        const response = await fetch(base + url.slice(4), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!response.ok) throw new Error("Không tải được ảnh đính kèm.");
        const objectUrl = URL.createObjectURL(await response.blob());
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    },
};
