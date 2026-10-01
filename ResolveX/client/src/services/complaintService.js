import api, { apiBaseUrl } from "./api";

export const listMine = (params) => api.get("/complaints", { params }).then((r) => r.data);
export const summary = () => api.get("/complaints/summary").then((r) => r.data);
export const categories = () => api.get("/complaints/categories").then((r) => r.data);
export const getOne = (id) => api.get(`/complaints/${id}`).then((r) => r.data);
export const remove = (id) => api.delete(`/complaints/${id}`).then((r) => r.data);

const asFormData = (values, file) => {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  if (file) form.append("image", file);
  return form;
};

export const create = (values, file) =>
  api.post("/complaints", asFormData(values, file)).then((r) => r.data);

export const update = (id, values, file) =>
  api.put(`/complaints/${id}`, asFormData(values, file)).then((r) => r.data);

// Evidence is an authenticated endpoint, so fetch it as a blob and hand the
// component an object URL it can put in an <img>.
export const evidenceUrl = async (id) => {
  const response = await api.get(`/complaints/${id}/evidence`, { responseType: "blob" });
  return URL.createObjectURL(response.data);
};

export const evidencePath = (id) => `${apiBaseUrl}/complaints/${id}/evidence`;
