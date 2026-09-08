import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import ComplaintTable from "../components/ComplaintTable";
import { getDashboardStats } from "../services/dashboardService";
import { getAllComplaints } from "../services/complaintService";

const emptyStats = { total: 0, pending: 0, assigned: 0, inProgress: 0, resolved: 0, rejected: 0 };

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true); setError("");
    try {
      const [statsData, complaintData] = await Promise.all([getDashboardStats(), getAllComplaints()]);
      setStats({ ...emptyStats, ...(statsData?.statistics || {}) });
      setComplaints(complaintData?.complaints || []);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.response?.data?.message || "Unable to load the admin dashboard.");
      if (err.response?.status === 401 || err.response?.status === 403) setError("Your administrator session is not valid. Please sign in again.");
    } finally { setLoading(false); }
  };
  useEffect(() => { loadDashboard(); }, []);

  const cards = [
    ["01", "TOTAL REPORTS", stats.total, "All submitted complaints", "purple"],
    ["02", "PENDING", stats.pending, "Waiting for action", "amber"],
    ["03", "ASSIGNED", stats.assigned, "Ownership confirmed", "cyan"],
    ["04", "IN PROGRESS", stats.inProgress, "Currently being handled", "blue"],
    ["05", "RESOLVED", stats.resolved, "Successfully closed", "green"],
    ["06", "REJECTED", stats.rejected, "Needs review", "pink"],
  ];
  const open = useMemo(() => stats.pending + stats.assigned + stats.inProgress, [stats]);

  return <AdminLayout>
    <section className="rx-page-head"><div><div className="rx-kicker">CONTROL CENTER / 01</div><h1 className="rx-display">Admin <span>overview.</span></h1><p className="rx-lede">Monitor complaints, ownership and resolution progress from one place.</p></div><Link to="/admin/complaints" className="rx-primary-btn"><span>▣</span> Manage complaints <b>↗</b></Link></section>
    <div className="rx-rule" />

    {error && <div className="rx-form-error admin-error"><b>{error}</b><button type="button" onClick={loadDashboard}>Try again</button></div>}

    <section className="rx-admin-stats">{cards.map(([n, label, value, desc, tone]) => <div className={`rx-admin-stat ${tone}`} key={label}><div><span>{n}</span><small>{label}</small></div><strong>{loading ? "—" : value}</strong><p>{desc}</p></div>)}</section>

    <section className="rx-admin-overview-grid">
      <div className="rx-panel rx-admin-summary"><div className="rx-panel-head"><div><div className="rx-kicker">OPERATIONS</div><h2>Resolution pulse</h2></div><button className="rx-small-action" onClick={loadDashboard}>Refresh ↻</button></div><div className="rx-pulse"><div className="rx-pulse-number">{loading ? "—" : open}</div><div><strong>open complaints</strong><p>Pending, assigned or currently in progress.</p></div></div><div className="rx-progress-list"><div><span>Pending</span><b>{stats.pending}</b><i><em style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }} /></i></div><div><span>Assigned</span><b>{stats.assigned}</b><i><em style={{ width: `${stats.total ? (stats.assigned / stats.total) * 100 : 0}%` }} /></i></div><div><span>In progress</span><b>{stats.inProgress}</b><i><em style={{ width: `${stats.total ? (stats.inProgress / stats.total) * 100 : 0}%` }} /></i></div><div><span>Resolved</span><b>{stats.resolved}</b><i><em style={{ width: `${stats.total ? (stats.resolved / stats.total) * 100 : 0}%` }} /></i></div></div></div>
      <div className="rx-panel rx-admin-note"><div className="rx-kicker">ADMIN TOOLS</div><h2>Keep the queue moving.</h2><p>Open Complaints to search reports, assign up to five members, update status and remove completed records.</p><Link to="/admin/complaints" className="rx-outline-btn">Open complaint management <span>↗</span></Link></div>
    </section>

    <section className="rx-panel rx-admin-table-panel"><div className="rx-panel-head"><div><div className="rx-kicker">LATEST REPORTS</div><h2>All complaints</h2></div><Link to="/admin/complaints" className="rx-text-link">Open manager ↗</Link></div><ComplaintTable complaints={complaints.slice(0, 8)} refreshComplaints={loadDashboard} /></section>
  </AdminLayout>;
}
