import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Avatar, Card, ConfirmDialog, Field, Loading, Modal } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage } from "../../lib/format";
import * as adminService from "../../services/adminService";

const ROLES = ["Administrator", "Moderator", "Support", "Field Agent"];
const PRESENCE = ["Online", "Away", "Offline"];
const BLANK = { name: "", email: "", role: "Moderator", presence: "Online", capacity: 8, expertise: "" };

function MemberModal({ initial, categories, onClose, onDone }) {
  const [form, setForm] = useState({
    ...BLANK,
    ...initial,
    expertise: Array.isArray(initial?.expertise) ? initial.expertise.join(", ") : initial?.expertise || "",
  });
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm((state) => ({ ...state, [key]: event.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      if (initial?.id) await adminService.updateMember(initial.id, form);
      else await adminService.createMember(form);
      toast.success(initial?.id ? "Member saved." : `${form.name} joined the team.`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={initial?.id ? "Edit member" : "Add a team member"}
      subtitle="Expertise decides which complaints route to this person."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy || !form.name.trim()}>
            {busy ? "Saving" : "Save member"}
          </button>
        </>
      }
    >
      <div className="field-row">
        <Field label="Name">
          <input className="input" value={form.name} onChange={set("name")} placeholder="Full name" />
        </Field>
        <Field label="Email" hint="Optional">
          <input className="input" type="email" value={form.email} onChange={set("email")} />
        </Field>
      </div>

      <div className="field-row">
        <Field label="Role">
          <select className="select" value={form.role} onChange={set("role")}>
            {ROLES.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </Field>
        <Field label="Presence">
          <select className="select" value={form.presence} onChange={set("presence")}>
            {PRESENCE.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Expertise" hint={`Comma separated. Available: ${categories.map((c) => c.name).join(", ")}`}>
        <input className="input" value={form.expertise} onChange={set("expertise")} placeholder="Hostel, Water" />
      </Field>

      <Field label="Capacity" hint="How many open complaints this person can hold comfortably.">
        <input className="input" type="number" min={1} max={50} value={form.capacity} onChange={set("capacity")} />
      </Field>
    </Modal>
  );
}

export default function AdminTeam() {
  const [members, setMembers] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await adminService.team();
    setMembers(data.members);
  }, []);

  useEffect(() => {
    load().catch(() => setMembers([]));
    adminService.categories().then((data) => setCategories(data.categories)).catch(() => setCategories([]));
  }, [load]);

  const remove = async () => {
    setBusy(true);
    try {
      await adminService.removeMember(deleting.id);
      toast.success(`${deleting.name} was removed.`);
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (!members) return <Loading label="Loading the team" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Team and roles</h1>
          <p>Who handles what, and how much each person is carrying right now.</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={() => setEditing({})}>
            <Icon name="plus" size={16} />
            Add member
          </button>
        </div>
      </div>

      <Card flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Expertise</th>
                <th>Open</th>
                <th>Resolved</th>
                <th>Presence</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <span className="row">
                      <Avatar name={member.name} color="#4f46e5" size="sm" presence={member.presence} />
                      <span>
                        <span className="table__title">{member.name}</span>
                        <span className="table__sub">{member.email || "No email on file"}</span>
                      </span>
                    </span>
                  </td>
                  <td>{member.role}</td>
                  <td className="small">{member.expertise?.join(", ") || "General"}</td>
                  <td>
                    {member.open} / {member.capacity}
                  </td>
                  <td>{member.resolved}</td>
                  <td>
                    <span className="chip">{member.presence}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setEditing({ ...member, id: member.id })}
                      >
                        Edit
                      </button>
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(member)}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing ? (
        <MemberModal
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
      {deleting ? (
        <ConfirmDialog
          title={`Remove ${deleting.name}?`}
          message="Complaints already assigned to them keep the name in their history."
          confirmLabel="Remove"
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}
