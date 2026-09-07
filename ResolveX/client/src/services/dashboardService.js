import api from "./api";

export const getDashboardStats = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/admin/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};