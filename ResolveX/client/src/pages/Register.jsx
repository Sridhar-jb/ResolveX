import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Icon from "../lib/icons";
import { errorMessage } from "../lib/format";
import { Field, Logo } from "../components/Ui";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm((state) => ({ ...state, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await signUp({ name: form.name, email: form.email, password: form.password });
      const user = await signIn({ email: form.email, password: form.password });
      toast.success(`Account created. Welcome, ${user.name}.`);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "We could not create that account."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo to="/" />
        <h1>
          One account. <em>Every issue you raise.</em>
        </h1>
        <p>
          Registering takes a name, an email and a password. After that, filing something takes about two
          minutes and you never have to ask where it went.
        </p>
        <div className="auth__points">
          <div>
            <Icon name="sparkles" size={17} />
            Routed to the right team automatically
          </div>
          <div>
            <Icon name="activity" size={17} />
            A timeline you can read at any time
          </div>
          <div>
            <Icon name="chat" size={17} />
            An assistant that knows your history
          </div>
        </div>
      </aside>

      <section className="auth__panel">
        <div className="auth__card">
          <h2>Create your account</h2>
          <p>Free, and it takes under a minute.</p>

          <form className="auth__form" onSubmit={submit}>
            <Field label="Full name">
              <input className="input" required value={form.name} onChange={set("name")} placeholder="Your name" />
            </Field>

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

            <div className="field-row">
              <Field label="Password" hint="At least 6 characters">
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={set("password")}
                />
              </Field>
              <Field label="Confirm password">
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirm}
                  onChange={set("confirm")}
                />
              </Field>
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? "Creating account" : "Create account"}
            </button>
          </form>

          <p className="auth__foot">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
