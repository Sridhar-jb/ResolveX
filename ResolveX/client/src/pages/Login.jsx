import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginUser } from "../services/authService";
import ThreeDScene from "../components/ThreeDScene";

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="rx-auth-page">
      <ThreeDScene variant="ambient" />
      <section className="rx-auth-showcase">
        <Link to="/" className="rx-auth-brand"><span>R</span> Resolve<span>X</span></Link>
        <div className="rx-auth-copy">
          <div className="rx-launch-pill">✦ RESOLUTION WORKSPACE</div>
          <h1>Turn every issue<br /><span>into progress.</span></h1>
          <p>One focused platform for reporting, assigning and resolving complaints with less friction.</p>
          <div className="rx-auth-points"><span>✓ Live complaint tracking</span><span>✓ Optional visual evidence</span><span>✓ Admin team workflow</span></div>
        </div>
        <div className="rx-auth-orbit" />
      </section>
      <section className="rx-auth-panel">
        <div className="rx-auth-card">
          <Link to="/" className="rx-back-link">← Back to home</Link>
          <div className="rx-auth-heading"><div className="rx-auth-mini">R<span>X</span></div><div className="rx-kicker">ACCOUNT ACCESS</div><h2>{title}</h2><p>{subtitle}</p></div>
          {children}
        </div>
      </section>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const change = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await loginUser({ email: formData.email.trim(), password: formData.password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to sign in. Please check your details.");
    } finally { setLoading(false); }
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to manage your complaints and stay updated.">
    <form onSubmit={submit} className="auth-form">
      <Field label="Email address"><input type="email" name="email" value={formData.email} onChange={change} placeholder="you@example.com" required /></Field>
      <Field label="Password"><input type="password" name="password" value={formData.password} onChange={change} placeholder="Enter your password" required /></Field>
      <button disabled={loading} className="auth-button">{loading ? "Signing in..." : "Sign in →"}</button>
    </form>
    <div className="auth-footer">New to ResolveX? <Link to="/register">Create account</Link></div>
    <Link className="admin-link" to="/admin-login">Administrator access ↗</Link>
  </AuthShell>;
}

export default Login;
