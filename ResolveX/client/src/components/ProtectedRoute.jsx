import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  let user = null;

  try { user = storedUser ? JSON.parse(storedUser) : null; }
  catch { localStorage.removeItem("user"); localStorage.removeItem("token"); }

  if (!user || !token) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return children;
}
