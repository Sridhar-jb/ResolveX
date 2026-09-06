import api from "./api";

// ----- Customer (user) side -----
export const getMyMessages = async () => (await api.get("/chat")).data;
export const sendMyMessage = async (text) => (await api.post("/chat", { text })).data;
export const getMyUnreadCount = async () => (await api.get("/chat/unread-count")).data;
export const deleteMyMessage = async (messageId) => (await api.delete(`/chat/${messageId}`)).data;

// ----- Admin side -----
export const getConversations = async () => (await api.get("/admin/chat/conversations")).data;
export const getSupportCustomers = async () => (await api.get("/admin/chat/customers")).data;
export const getConversationMessages = async (userId) => (await api.get(`/admin/chat/${userId}`)).data;
export const sendConversationMessage = async (userId, text) =>
  (await api.post(`/admin/chat/${userId}`, { text })).data;
export const getAdminUnreadCount = async () => (await api.get("/admin/chat/unread-count")).data;
export const deleteConversationMessage = async (userId, messageId) =>
  (await api.delete(`/admin/chat/${userId}/${messageId}`)).data;
