import api from "./api";
export const getAllComplaints = async () => (await api.get("/admin/complaints")).data;
export const assignComplaint = async (id, assignedMembers) => (await api.put(`/admin/assign/${id}`, { assignedMembers })).data;
export const autoAssignComplaint = async (id) => (await api.put(`/admin/auto-assign/${id}`)).data;
export const updateComplaintStatus = async (id,status,remarks) => (await api.put(`/admin/status/${id}`,{status,remarks})).data;
// Admin: delete any complaint
export const deleteComplaintAsAdmin = async (id) => (await api.delete(`/admin/complaints/${id}`)).data;
// User: delete one of their own complaints
export const deleteMyComplaint = async (id) => (await api.delete(`/complaints/${id}`)).data;
