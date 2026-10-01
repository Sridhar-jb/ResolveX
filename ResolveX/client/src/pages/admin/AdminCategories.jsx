import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, ConfirmDialog, Field, Loading, Modal, Toggle } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage } from "../../lib/format";
import * as adminService from "../../services/adminService";

const BLANK = { name: "", description: "", color: "#6366f1", keywords: "", isActive: true };

function CategoryModal({ initial, onClose, onDone }) {
  const [form, setForm] = useState({
    ...BLANK,
    ...initial,
    keywords: Array.isArray(initial?.keywords) ? initial.keywords.join(", ") : initial?.keywords || "",
  });
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm((state) => ({ ...state, [key]: event.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      if (initial?.id) await adminService.updateCategory(initial.id, form);
      else await adminService.createCategory(form);
      toast.success(initial?.id ? "Category saved." : `${form.name} added.`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={initial?.id ? "Edit category" : "New category"}
      subtitle="Keywords help routing pick this category from the complaint text."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy || !form.name.trim()}>
            {busy ? "Saving" : "Save category"}
          </button>
        </>
      }
    >
      <Field label="Name">
        <input className="input" value={form.name} onChange={set("name")} maxLength={40} placeholder="e.g. Hostel" />
      </Field>

      <Field label="Description" hint="Shown under the category picker on the complaint form.">
        <input
          className="input"
          value={form.description}
          onChange={set("description")}
          maxLength={200}
          placeholder="Rooms, mess, wardens and hostel facilities"
        />
      </Field>

      <Field label="Keywords" hint="Comma separated. Words that should route a complaint here.">
        <input className="input" value={form.keywords} onChange={set("keywords")} placeholder="hostel, mess, warden, room" />
      </Field>

      <Field label="Colour" hint="Used in charts and legends.">
        <input
          type="color"
          className="input"
          style={{ padding: 6, height: 46 }}
          value={form.color}
          onChange={set("color")}
        />
      </Field>

      <Toggle
        label="Available on the complaint form"
        description="Switch off to retire a category without deleting its history."
        on={form.isActive}
        onChange={(value) => setForm((state) => ({ ...state, isActive: value }))}
      />
    </Modal>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await adminService.categories();
    setCategories(data.categories);
  }, []);

  useEffect(() => {
    load().catch(() => setCategories([]));
  }, [load]);

  const remove = async () => {
    setBusy(true);
    try {
      await adminService.removeCategory(deleting.id);
      toast.success("Category deleted.");
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (!categories) return <Loading label="Loading categories" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Category management</h1>
          <p>Categories decide who gets a complaint. Keywords decide which category it lands in.</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={() => setEditing({})}>
            <Icon name="plus" size={16} />
            New category
          </button>
        </div>
      </div>

      <Card flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Keywords</th>
                <th>Complaints</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <span className="row">
                      <span className="legend__dot" style={{ background: category.color, width: 12, height: 12 }} />
                      <span>
                        <span className="table__title">{category.name}</span>
                        <span className="table__sub">{category.description || "No description"}</span>
                      </span>
                    </span>
                  </td>
                  <td className="small">{category.keywords?.join(", ") || "Default rules"}</td>
                  <td>{category.complaints}</td>
                  <td>
                    <span className={`pill ${category.isActive ? "pill--resolved" : "pill--neutral"}`}>
                      {category.isActive ? "Active" : "Retired"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setEditing({ ...category, id: category.id })}
                      >
                        Edit
                      </button>
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(category)}>
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

      {editing ? <CategoryModal initial={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} /> : null}
      {deleting ? (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message="Categories still in use cannot be deleted. Retire them instead."
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}
