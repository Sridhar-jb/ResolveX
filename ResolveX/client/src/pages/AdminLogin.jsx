import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginUser } from "../services/authService";
import { AuthShell, Field } from "./Login";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await loginUser(f);
      if (data.user.role !== "admin") {
        localStorage.removeItem("token"); localStorage.removeItem("user");
        return toast.error("This account does not have administrator access.");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Administrator access granted");
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Administrator sign in failed");
    } finally { setLoading(false); }
  };
  return <AuthShell title="Administrator sign in" subtitle="Use an authorized ResolveX administrator account.">
    <div className="rx-admin-notice"><span>!</span><div><b>Restricted area</b><small>Administrator access only.</small></div></div>
    <form onSubmit={submit} className="auth-form">
      <Field label="Administrator email"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="admin@example.com" required /></Field>
      <Field label="Password"><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Enter password" required /></Field>
      <button disabled={loading} className="auth-button admin-button">{loading ? "Checking access..." : "Enter Admin Panel →"}</button>
    </form>
    <div className="auth-footer">Not an administrator? <Link to="/login">Go to user sign in</Link></div>
  </AuthShell>;
}
