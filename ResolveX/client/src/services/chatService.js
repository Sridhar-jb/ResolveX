import api from "./api";

export const myThread = () => api.get("/chat").then((r) => r.data);
export const sendToSupport = (text) => api.post("/chat", { text }).then((r) => r.data);
export const myUnread = () => api.get("/chat/unread-count").then((r) => r.data);
export const ask = (text) => api.post("/chat/ask", { text }).then((r) => r.data);
export const clearThread = () => api.delete("/chat").then((r) => r.data);
export const deleteMyMessage = (id) => api.delete(`/chat/${id}`).then((r) => r.data);

export const conversations = () => api.get("/admin/chat/conversations").then((r) => r.data);
export const customers = () => api.get("/admin/chat/customers").then((r) => r.data);
export const thread = (userId) => api.get(`/admin/chat/${userId}`).then((r) => r.data);
export const reply = (userId, text) => api.post(`/admin/chat/${userId}`, { text }).then((r) => r.data);
export const adminUnread = () => api.get("/admin/chat/unread-count").then((r) => r.data);
export const deleteConversation = (userId) => api.delete(`/admin/chat/${userId}`).then((r) => r.data);
