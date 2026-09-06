import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import api from "../services/api";

function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await api.get("/complaints");
        if (mounted) setComplaints(response.data?.complaints || []);
      } catch (error) {
        console.error("Dashboard complaints error:", error);
        if (mounted) setComplaints([]);
      } finally { if (mounted) setLoading(false); }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    active: complaints.filter((c) => ["Assigned", "In Progress"].includes(c.status)).length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  }), [complaints]);

  const statusClass = (status = "Pending") => status.toLowerCase().replace(/\s+/g, "-");

  return <UserLayout>
    <section className="rx-page-head">
      <div><div className="rx-kicker">PERSONAL WORKSPACE / 01</div><h1 className="rx-display">Welcome back, <span>{user?.name || "User"}</span>.</h1><p className="rx-lede">Track every issue from first report to final resolution.</p></div>
      <Link to="/submit" className="rx-primary-btn"><span>＋</span> Write a Complaint <b>↗</b></Link>
    </section>
    <div className="rx-rule" />

    <section className="rx-stats-grid">
      <div className="rx-stat-card featured"><div className="rx-stat-top"><span>01 / TOTAL</span><span>ALL</span></div><strong>{stats.total}</strong><p>Complaints submitted</p></div>
      <div className="rx-stat-card"><div className="rx-stat-top"><span>02 / PENDING</span><span>OPEN</span></div><strong>{stats.pending}</strong><p>Waiting for action</p></div>
      <div className="rx-stat-card"><div className="rx-stat-top"><span>03 / ACTIVE</span><span>LIVE</span></div><strong>{stats.active}</strong><p>Assigned or in progress</p></div>
      <div className="rx-stat-card"><div className="rx-stat-top"><span>04 / RESOLVED</span><span>DONE</span></div><strong>{stats.resolved}</strong><p>Issues closed successfully</p></div>
    </section>

    <section className="rx-3d-dashboard-visual rx-panel">
      <div><div className="rx-kicker">3D RESOLUTION MAP</div><h2>See your progress in motion.</h2><p>Every status becomes part of a live visual path from report to resolution.</p></div>
      <div className="rx-3d-bars" aria-hidden="true">
        <i style={{height:`${Math.max(24, stats.total*7)}px`}}><span>ALL</span></i>
        <i style={{height:`${Math.max(42, stats.pending*14+20)}px`}}><span>OPEN</span></i>
        <i style={{height:`${Math.max(58, stats.active*16+28)}px`}}><span>ACTIVE</span></i>
        <i style={{height:`${Math.max(76, stats.resolved*17+32)}px`}}><span>DONE</span></i>
      </div>
    </section>

    <section className="rx-content-grid">
      <div className="rx-panel rx-recent-panel">
        <div className="rx-panel-head"><div><div className="rx-kicker">ACTIVITY</div><h2>Recent complaints</h2></div><Link to="/complaints" className="rx-text-link">View all ↗</Link></div>
        {loading ? <div className="rx-empty"><div className="rx-loader" /><p>Loading your workspace…</p></div> : complaints.length === 0 ? <div className="rx-empty"><div className="rx-empty-icon">＋</div><h3>No complaints yet</h3><p>Your workspace is clear. Report an issue whenever you need help.</p><Link to="/submit" className="rx-primary-btn small">Write your first complaint ↗</Link></div> : <div className="rx-table-wrap"><table className="rx-table"><thead><tr><th>Issue</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead><tbody>{complaints.slice(0, 6).map((c) => <tr key={c._id}><td><strong>{c.title}</strong><small>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</small></td><td>{c.category || "General"}</td><td><span className={`rx-priority ${(c.priority || "Medium").toLowerCase()}`}>{c.priority || "Medium"}</span></td><td><span className={`rx-status ${statusClass(c.status)}`}>{c.status || "Pending"}</span></td></tr>)}</tbody></table></div>}
      </div>
      <aside className="rx-panel rx-action-panel"><div className="rx-kicker">QUICK START</div><h2>Make the issue clear.</h2><p>Add the essentials, choose a priority, and attach an image when visual proof helps explain the problem.</p><Link to="/submit" className="rx-outline-btn">Open complaint form <span>↗</span></Link><div className="rx-mini-process"><div><b>01</b><span>Submit</span></div><div><b>02</b><span>Assigned</span></div><div><b>03</b><span>Resolved</span></div></div></aside>
    </section>
  </UserLayout>;
}
export default Dashboard;
