import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Icon from "../lib/icons";
import { errorMessage } from "../lib/format";
import { Field, Logo } from "../components/Ui";
import { useAuth } from "../context/AuthContext";

const POINTS = [
  "Follow every complaint from filed to closed",
  "Get an answer without chasing anyone",
  "See who owns your issue right now",
];

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm((state) => ({ ...state, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const user = await signIn(form);
      toast.success(`Welcome back, ${user.name}.`);
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "We could not sign you in."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo to="/" />
        <h1>
          Your complaint has <em>a place to live.</em>
        </h1>
        <p>
          Sign in to see what happened to everything you reported, and to file the next thing in about two
          minutes.
        </p>
        <div className="auth__points">
          {POINTS.map((point) => (
            <div key={point}>
              <Icon name="check" size={17} />
              {point}
            </div>
          ))}
        </div>
      </aside>

      <section className="auth__panel">
        <div className="auth__card">
          <h2>Sign in</h2>
          <p>Use the email you registered with.</p>

          <form className="auth__form" onSubmit={submit}>
            <Field label="Email">
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password">
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={set("password")}
                placeholder="Your password"
              />
            </Field>

            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? "Signing in" : "Sign in"}
            </button>
          </form>

          <p className="auth__foot">
            New here? <Link to="/register">Create an account</Link>
          </p>
          <p className="auth__foot">
            <Link to="/admin-login">Sign in as an administrator</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
