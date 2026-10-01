import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Icon from "../lib/icons";
import { errorMessage } from "../lib/format";
import { Field, Logo } from "../components/Ui";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm((state) => ({ ...state, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const user = await signIn(form);
      if (user.role !== "admin") {
        signOut();
        toast.error("That account does not have admin access.");
        return;
      }
      toast.success("Admin control centre unlocked.");
      navigate("/admin", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "We could not sign you in."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo to="/" tagline="Admin control centre" />
        <h1>
          Monitor, manage and <em>resolve.</em>
        </h1>
        <p>
          The control centre shows the whole desk: what is pending, who is loaded, which category keeps coming
          back, and every action anyone took.
        </p>
        <div className="auth__points">
          <div>
            <Icon name="chart" size={17} />
            Live statistics and 30-day trends
          </div>
          <div>
            <Icon name="team" size={17} />
            Assignment by expertise and workload
          </div>
          <div>
            <Icon name="history" size={17} />
            A searchable audit trail
          </div>
        </div>
      </aside>

      <section className="auth__panel">
        <div className="auth__card">
          <h2>Administrator sign in</h2>
          <p>Restricted to accounts with the admin role.</p>

          <div className="notice" style={{ marginTop: 20 }}>
            <Icon name="shield" size={18} />
            <span>
              <strong>Admin area</strong>
              Everything you do here is recorded in the audit log.
            </span>
          </div>

          <form className="auth__form" onSubmit={submit}>
            <Field label="Admin email">
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="admin@resolvex.app"
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
              />
            </Field>

            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? "Signing in" : "Enter control centre"}
            </button>
          </form>

          <p className="auth__foot">
            Not an administrator? <Link to="/login">Member sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
