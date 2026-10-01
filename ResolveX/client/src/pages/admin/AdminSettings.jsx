import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, Field, Loading, Toggle } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage, PRIORITIES } from "../../lib/format";
import * as adminService from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";

export default function AdminSettings() {
  const { preference, setPreference } = useTheme();
  const [settings, setSettings] = useState(null);
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminService.settings().then((data) => setSettings(data.settings)).catch(() => setSettings(null));
    adminService.health().then((data) => setHealth(data.health)).catch(() => setHealth(null));
  }, []);

  const set = (key, value) => setSettings((state) => ({ ...state, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await adminService.saveSettings(settings);
      setSettings(data.settings);
      toast.success("Settings saved.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <Loading label="Loading settings" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>System settings</h1>
          <p>How ResolveX behaves for everyone who uses it.</p>
        </div>
      </div>

      <form className="grid-sidebar" onSubmit={save}>
        <div className="stack">
          <Card title="Identity" subtitle="What people see at the top of the product.">
            <div className="stack">
              <Field label="Site name">
                <input className="input" value={settings.siteName} onChange={(e) => set("siteName", e.target.value)} />
              </Field>
              <Field label="Tagline">
                <input className="input" value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Complaint handling" subtitle="Defaults applied to every new report.">
            <div className="stack">
              <div className="field-row">
                <Field label="Default priority" hint="Used when the text gives no strong signal.">
                  <select
                    className="select"
                    value={settings.defaultPriority}
                    onChange={(e) => set("defaultPriority", e.target.value)}
                  >
                    {PRIORITIES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Resolution target (hours)">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={720}
                    value={settings.resolutionTargetHours}
                    onChange={(e) => set("resolutionTargetHours", Number(e.target.value))}
                  />
                </Field>
              </div>

              <Field label="Maximum evidence size (MB)">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={15}
                  value={settings.maxUploadMb}
                  onChange={(e) => set("maxUploadMb", Number(e.target.value))}
                />
              </Field>

              <div>
                <Toggle
                  label="Automatic assignment"
                  description="Route new complaints by expertise and workload as they arrive."
                  on={settings.autoAssign}
                  onChange={(value) => set("autoAssign", value)}
                />
                <Toggle
                  label="AI assistant"
                  description="Available to members on the support page and to admins here."
                  on={settings.aiAssistant}
                  onChange={(value) => set("aiAssistant", value)}
                />
                <Toggle
                  label="Open registration"
                  description="Let anyone create a member account."
                  on={settings.allowRegistration}
                  onChange={(value) => set("allowRegistration", value)}
                />
                <Toggle
                  label="Email notifications"
                  description="Send status changes by email as well as in-app."
                  on={settings.emailNotifications}
                  onChange={(value) => set("emailNotifications", value)}
                />
                <Toggle
                  label="Maintenance mode"
                  description="Show the desk as paused while work is happening."
                  on={settings.maintenanceMode}
                  onChange={(value) => set("maintenanceMode", value)}
                />
              </div>
            </div>
          </Card>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? "Saving" : "Save settings"}
            </button>
          </div>
        </div>

        <div className="stack">
          <Card title="Your view" subtitle="This only changes what you see.">
            <Field label="Theme">
              <select className="select" value={preference} onChange={(event) => setPreference(event.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">Match my system</option>
              </select>
            </Field>
          </Card>

          <Card title="System status" subtitle={health?.maintenanceMode ? "Maintenance mode on" : "All services live"}>
            <div className="stack-sm">
              {(health?.services || []).map((service) => (
                <div className="status-tile" key={service.name}>
                  <span className="quick__icon" style={{ width: 32, height: 32 }}>
                    <Icon name={service.name === "Database" ? "database" : "layers"} size={15} />
                  </span>
                  <span>
                    <strong>{service.name}</strong>
                    <span className={service.status === "Online" ? "" : "is-off"}>{service.status}</span>
                  </span>
                </div>
              ))}
            </div>

            {health ? (
              <div className="meta-grid mt">
                <div className="meta">
                  <span>Complaints stored</span>
                  <strong>{health.records.complaints}</strong>
                </div>
                <div className="meta">
                  <span>Accounts</span>
                  <strong>{health.records.users}</strong>
                </div>
                <div className="meta">
                  <span>Messages</span>
                  <strong>{health.records.messages}</strong>
                </div>
                <div className="meta">
                  <span>API uptime</span>
                  <strong>{Math.floor(health.uptimeSeconds / 60)} min</strong>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </form>
    </>
  );
}
