import api from "./api";

export const overview = () => api.get("/admin/overview").then((r) => r.data);
export const analytics = (days = 30) => api.get("/admin/analytics", { params: { days } }).then((r) => r.data);
export const report = (days = 30) => api.get("/admin/reports", { params: { days } }).then((r) => r.data);
export const health = () => api.get("/admin/health").then((r) => r.data);

export const complaints = (params) => api.get("/admin/complaints", { params }).then((r) => r.data);
export const assign = (id, assignedMembers) =>
  api.put(`/admin/complaints/${id}/assign`, { assignedMembers }).then((r) => r.data);
export const autoAssign = (id) => api.put(`/admin/complaints/${id}/auto-assign`).then((r) => r.data);
export const setStatus = (id, status, remarks) =>
  api.put(`/admin/complaints/${id}/status`, { status, remarks }).then((r) => r.data);
export const removeComplaint = (id) => api.delete(`/admin/complaints/${id}`).then((r) => r.data);

export const users = (params) => api.get("/admin/users", { params }).then((r) => r.data);
export const updateUser = (id, payload) => api.put(`/admin/users/${id}`, payload).then((r) => r.data);
export const removeUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);

export const categories = () => api.get("/admin/categories").then((r) => r.data);
export const createCategory = (payload) => api.post("/admin/categories", payload).then((r) => r.data);
export const updateCategory = (id, payload) => api.put(`/admin/categories/${id}`, payload).then((r) => r.data);
export const removeCategory = (id) => api.delete(`/admin/categories/${id}`).then((r) => r.data);

export const team = () => api.get("/admin/team").then((r) => r.data);
export const createMember = (payload) => api.post("/admin/team", payload).then((r) => r.data);
export const updateMember = (id, payload) => api.put(`/admin/team/${id}`, payload).then((r) => r.data);
export const removeMember = (id) => api.delete(`/admin/team/${id}`).then((r) => r.data);

export const auditLogs = (params) => api.get("/admin/audit", { params }).then((r) => r.data);

export const settings = () => api.get("/admin/settings").then((r) => r.data);
export const saveSettings = (payload) => api.put("/admin/settings", payload).then((r) => r.data);
