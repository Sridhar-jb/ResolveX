import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import ComplaintTable from "../components/ComplaintTable";
import { getAllComplaints } from "../services/complaintService";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComplaints = async () => {
    setLoading(true); setError("");
    try { const data = await getAllComplaints(); setComplaints(data?.complaints || []); }
    catch (err) { console.error(err); setError(err.response?.data?.message || "Unable to load complaints."); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadComplaints(); }, []);

  const filtered = useMemo(() => complaints.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = (c.title || "").toLowerCase().includes(q) || (c.category || "").toLowerCase().includes(q) || (c.user?.name || "").toLowerCase().includes(q);
    return matchesSearch && (statusFilter === "All" || c.status === statusFilter);
  }), [complaints, search, statusFilter]);

  return <AdminLayout>
    <section className="rx-page-head compact"><div><div className="rx-kicker">CONTROL CENTER / 02</div><h1 className="rx-display">Complaint <span>management.</span></h1><p className="rx-lede">Search, assign, update and close every submitted issue.</p></div><button className="rx-primary-btn" onClick={loadComplaints}><span>↻</span> Refresh <b>↗</b></button></section>
    <div className="rx-rule" />
    <section className="rx-panel rx-filter-panel"><div className="rx-filter-label"><span>FILTER</span><small>{filtered.length} of {complaints.length} reports</small></div><div className="rx-filter-grid"><label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, category or user…" /></label><label>Status<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option><option>Pending</option><option>Assigned</option><option>In Progress</option><option>Resolved</option><option>Rejected</option></select></label></div></section>
    {error && <div className="rx-form-error admin-error"><b>{error}</b><button type="button" onClick={loadComplaints}>Try again</button></div>}
    {loading ? <div className="rx-panel rx-empty"><div className="rx-loader" /><p>Loading complaint queue…</p></div> : <div className="rx-panel rx-admin-table-panel"><ComplaintTable complaints={filtered} refreshComplaints={loadComplaints} /></div>}
  </AdminLayout>;
}
