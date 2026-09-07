import api from "./api";
export const askAI = async (text) => (await api.post("/chat/ai", { text })).data;
