import api from "./api";

export const list = (limit = 30) => api.get("/notifications", { params: { limit } }).then((r) => r.data);
export const markRead = (id) => api.put(`/notifications/${id}/read`).then((r) => r.data);
export const markAllRead = () => api.put("/notifications/read-all").then((r) => r.data);
export const remove = (id) => api.delete(`/notifications/${id}`).then((r) => r.data);
