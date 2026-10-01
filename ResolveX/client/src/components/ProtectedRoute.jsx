import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading } from "./Ui";

export default function ProtectedRoute({ role, children }) {
  const { user, token, ready } = useAuth();
  const location = useLocation();

  if (!ready && token) return <Loading label="Checking your session" />;
  if (!user || !token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
}
