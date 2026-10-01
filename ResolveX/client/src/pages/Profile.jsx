import { useState } from "react";
import { toast } from "react-toastify";
import { Avatar, Card, Field, Toggle } from "../components/Ui";
import Icon from "../lib/icons";
import { errorMessage, formatDate } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import * as authService from "../services/authService";

const COLORS = ["#6366f1", "#3b82f6", "#22d3ee", "#d946ef", "#34d399", "#f59e0b", "#fb7185"];

export default function Profile() {
  const { user, applyUser } = useAuth();
  const { preference, setPreference } = useTheme();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "",
    avatarColor: user?.avatarColor || "#6366f1",
  });
  const [prefs, setPrefs] = useState({
    emailUpdates: user?.preferences?.emailUpdates ?? true,
    pushUpdates: user?.preferences?.pushUpdates ?? true,
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const set = (key) => (event) => setForm((state) => ({ ...state, [key]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const data = await authService.updateProfile({
        ...form,
        preferences: { ...prefs, theme: preference },
      });
      applyUser(data.user);
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await authService.changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      toast.success("Password changed.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  const updatePreference = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      const data = await authService.updateProfile({ preferences: { ...next, theme: preference } });
      applyUser(data.user);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Your profile</h1>
          <p>Manage your account details and how ResolveX talks to you.</p>
        </div>
      </div>

      <div className="grid-split">
        <div className="stack">
          <Card>
            <div className="profile-head">
              <Avatar name={form.name} color={form.avatarColor} size="lg" />
              <div>
                <h2>{form.name}</h2>
                <p>{form.email}</p>
                <span className="chip" style={{ marginTop: 8, display: "inline-block" }}>
                  {user?.role === "admin" ? "Administrator" : "Member"}
                </span>
              </div>
            </div>

            <div className="mt">
              <p className="field__label">Avatar colour</p>
              <div className="color-picker mt-sm">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use ${color}`}
                    className={`color-dot${form.avatarColor === color ? " is-active" : ""}`}
                    style={{ background: color }}
                    onClick={() => setForm((state) => ({ ...state, avatarColor: color }))}
                  />
                ))}
              </div>
            </div>

            <div className="meta-grid mt">
              <div className="meta">
                <span>Member since</span>
                <strong>{formatDate(user?.createdAt)}</strong>
              </div>
              <div className="meta">
                <span>Last sign-in</span>
                <strong>{formatDate(user?.lastLoginAt) || "This session"}</strong>
              </div>
            </div>
          </Card>

          <Card title="Preferences" subtitle="Theme and updates.">
            <Field label="Theme">
              <select className="select" value={preference} onChange={(event) => setPreference(event.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">Match my system</option>
              </select>
            </Field>

            <div className="mt">
              <Toggle
                label="Email updates"
                description="Status changes on your complaints."
                on={prefs.emailUpdates}
                onChange={(value) => updatePreference("emailUpdates", value)}
              />
              <Toggle
                label="In-app notifications"
                description="Show updates in the bell menu."
                on={prefs.pushUpdates}
                onChange={(value) => updatePreference("pushUpdates", value)}
              />
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card title="Account information" subtitle="Keep this current so the team can reach you.">
            <form className="stack" onSubmit={saveProfile}>
              <div className="field-row">
                <Field label="Full name">
                  <input className="input" required value={form.name} onChange={set("name")} />
                </Field>
                <Field label="Email">
                  <input className="input" type="email" required value={form.email} onChange={set("email")} />
                </Field>
              </div>

              <div className="field-row">
                <Field label="Phone" hint="Optional">
                  <input className="input" value={form.phone} onChange={set("phone")} placeholder="Optional" />
                </Field>
                <Field label="Department or block" hint="Optional">
                  <input
                    className="input"
                    value={form.department}
                    onChange={set("department")}
                    placeholder="e.g. Computer Science"
                  />
                </Field>
              </div>

              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn--primary" disabled={savingProfile}>
                  {savingProfile ? "Saving" : "Save changes"}
                </button>
              </div>
            </form>
          </Card>

          <Card title="Password" subtitle="Use at least 6 characters.">
            <form className="stack" onSubmit={savePassword}>
              <div className="field-row">
                <Field label="Current password">
                  <input
                    className="input"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={passwords.currentPassword}
                    onChange={(event) =>
                      setPasswords((state) => ({ ...state, currentPassword: event.target.value }))
                    }
                  />
                </Field>
                <Field label="New password">
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={passwords.newPassword}
                    onChange={(event) => setPasswords((state) => ({ ...state, newPassword: event.target.value }))}
                  />
                </Field>
              </div>

              <div className="notice notice--info">
                <Icon name="shield" size={17} />
                <span>Changing your password does not sign out this device.</span>
              </div>

              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn--primary" disabled={savingPassword}>
                  {savingPassword ? "Saving" : "Change password"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
