import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerUser } from "../services/authService";
import { AuthShell, Field } from "./Login";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const change = (e) => setF((p) => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (f.password.length < 6) return toast.error("Password must contain at least 6 characters");
    if (f.password !== f.confirmPassword) return toast.error("Passwords do not match");
    try {
      setLoading(true);
      await registerUser({ name: f.name.trim(), email: f.email.trim(), password: f.password });
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };
  return <AuthShell title="Create your account" subtitle="Start tracking and resolving issues in one place.">
    <form onSubmit={submit} className="auth-form">
      <Field label="Full name"><input name="name" value={f.name} onChange={change} placeholder="Your full name" required /></Field>
      <Field label="Email address"><input type="email" name="email" value={f.email} onChange={change} placeholder="you@example.com" required /></Field>
      <div className="auth-two"><Field label="Password"><input type="password" name="password" value={f.password} onChange={change} placeholder="Minimum 6 characters" required /></Field><Field label="Confirm password"><input type="password" name="confirmPassword" value={f.confirmPassword} onChange={change} placeholder="Repeat password" required /></Field></div>
      <button disabled={loading} className="auth-button">{loading ? "Creating account..." : "Create account →"}</button>
    </form>
    <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
  </AuthShell>;
}
