import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ComplaintTable from "../../components/ComplaintTable";
import ComplaintModal from "../../components/ComplaintModal";
import { Avatar, Card, ConfirmDialog, Field, Loading, Modal, Pagination } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage, PRIORITIES, STATUSES } from "../../lib/format";
import * as adminService from "../../services/adminService";

/* ------------------------------ assign modal ------------------------------ */

function AssignModal({ complaint, team, onClose, onDone }) {
  const [selected, setSelected] = useState(complaint.assignedMembers || []);
  const [busy, setBusy] = useState(false);

  const toggle = (name) =>
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : current.length < 5 ? [...current, name] : current
    );

  const save = async () => {
    setBusy(true);
    try {
      await adminService.assign(complaint._id, selected);
      toast.success(`Assigned to ${selected.length} member(s).`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const auto = async () => {
    setBusy(true);
    try {
      const data = await adminService.autoAssign(complaint._id);
      toast.success(`Routed to ${data.routing.assignedMembers.join(", ")}.`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Assign this complaint"
      subtitle={`${complaint.reference} - ${complaint.title}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={auto} disabled={busy}>
            <Icon name="sparkles" size={16} />
            Auto-assign
          </button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy || !selected.length}>
            {busy ? "Saving" : "Save assignment"}
          </button>
        </>
      }
    >
      <p className="muted small">Pick up to five people. Auto-assign uses expertise and current workload.</p>

      <div className="card" style={{ boxShadow: "none" }}>
        {team.map((member) => (
          <button
            key={member._id}
            type="button"
            className={`list-row${selected.includes(member.name) ? " is-selected" : ""}`}
            style={{ width: "100%", background: "none", border: 0, borderBottom: "1px solid var(--line)" }}
            onClick={() => toggle(member.name)}
          >
            <Avatar name={member.name} color="#4f46e5" size="sm" presence={member.presence} />
            <span className="list-row__text" style={{ textAlign: "left" }}>
              <strong>{member.name}</strong>
              <span>
                {member.role} - {member.open} open - {member.expertise?.join(", ") || "General"}
              </span>
            </span>
            {selected.includes(member.name) ? <Icon name="check" size={17} /> : null}
          </button>
        ))}
        {team.length === 0 ? <p className="muted small" style={{ padding: 18 }}>No team members yet.</p> : null}
      </div>
    </Modal>
  );
}

/* ------------------------------ status modal ------------------------------ */

function StatusModal({ complaint, onClose, onDone }) {
  const [status, setStatus] = useState(complaint.status);
  const [remarks, setRemarks] = useState(complaint.remarks || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await adminService.setStatus(complaint._id, status, remarks);
      toast.success(`Marked ${status}.`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Update status"
      subtitle={`${complaint.reference} - ${complaint.title}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>
            {busy ? "Saving" : "Save status"}
          </button>
        </>
      }
    >
      <Field label="Status">
        <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Note for the reporter" hint="This is shown on their complaint and in their notification.">
        <textarea
          className="textarea"
          style={{ minHeight: 100 }}
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="What was done, or what is still needed."
        />
      </Field>
    </Modal>
  );
}

/* --------------------------------- page ----------------------------------- */

export default function AdminComplaints() {
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState(null);
  const [team, setTeam] = useState([]);
  const [filters, setFilters] = useState({
    search: params.get("search") || "",
    status: "All",
    category: "All",
    priority: "All",
  });
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [changing, setChanging] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState([]);

  const load = useCallback(async () => {
    const data = await adminService.complaints({ ...filters, page, limit: 15 });
    setState(data);
  }, [filters, page]);

  useEffect(() => {
    load().catch((error) => {
      toast.error(errorMessage(error));
      setState({ complaints: [], page: 1, pages: 1, total: 0 });
    });
  }, [load]);

  useEffect(() => {
    adminService.team().then((data) => setTeam(data.members)).catch(() => setTeam([]));
    adminService.categories().then((data) => setCategories(data.categories)).catch(() => setCategories([]));
  }, []);

  const setFilter = (key) => (event) => {
    setPage(1);
    const value = event.target.value;
    setFilters((current) => ({ ...current, [key]: value }));
    if (key === "search") setParams(value ? { search: value } : {}, { replace: true });
  };

  const refresh = async () => {
    setAssigning(null);
    setChanging(null);
    setDeleting(null);
    await load();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await adminService.removeComplaint(deleting._id);
      toast.success("Complaint deleted.");
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (!state) return <Loading label="Loading the queue" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Complaints</h1>
          <p>Every report on the desk, with the tools to route and close it.</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--ghost" onClick={() => load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      <Card flush>
        <div className="filter-bar">
          <div className="search">
            <Icon name="search" size={16} className="search__icon" />
            <input value={filters.search} onChange={setFilter("search")} placeholder="Search title, reference or category" aria-label="Search complaints" />
          </div>
          <select className="select" value={filters.status} onChange={setFilter("status")} aria-label="Filter by status">
            <option value="All">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select className="select" value={filters.category} onChange={setFilter("category")} aria-label="Filter by category">
            <option value="All">All categories</option>
            {categories.map((item) => (
              <option key={item.id || item.name}>{item.name}</option>
            ))}
          </select>
          <select className="select" value={filters.priority} onChange={setFilter("priority")} aria-label="Filter by priority">
            <option value="All">All priorities</option>
            {PRIORITIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <ComplaintTable
          variant="admin"
          complaints={state.complaints}
          onView={(complaint) => setViewId(complaint._id)}
          onAssign={(complaint) => setAssigning(complaint)}
          onStatus={(complaint) => setChanging(complaint)}
          onDelete={(complaint) => setDeleting(complaint)}
          emptyTitle="Nothing matches those filters"
          emptyMessage="Clear the search or pick another status."
        />

        <Pagination page={state.page} pages={state.pages} total={state.total} onChange={setPage} />
      </Card>

      {viewId ? <ComplaintModal complaintId={viewId} onClose={() => setViewId(null)} /> : null}
      {assigning ? (
        <AssignModal complaint={assigning} team={team} onClose={() => setAssigning(null)} onDone={refresh} />
      ) : null}
      {changing ? <StatusModal complaint={changing} onClose={() => setChanging(null)} onDone={refresh} /> : null}
      {deleting ? (
        <ConfirmDialog
          title={`Delete ${deleting.reference}?`}
          message={deleting.title}
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}
