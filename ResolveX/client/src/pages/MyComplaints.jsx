import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import api from "../services/api";
import { deleteMyComplaint } from "../services/complaintService";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchComplaints = async () => {
    try { const res = await api.get("/complaints"); setComplaints(res.data?.complaints || []); }
    catch (err) { console.error("My complaints error:", err); setComplaints([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchComplaints(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this complaint? This cannot be undone.")) return;
    setDeletingId(id);
    try { await deleteMyComplaint(id); setComplaints((p) => p.filter((c) => c._id !== id)); }
    catch (err) { alert(err.response?.data?.message || "Failed to delete complaint."); }
    finally { setDeletingId(null); }
  };
  const statusClass = (s = "Pending") => s.toLowerCase().replace(/\s+/g, "-");

  return <UserLayout>
    <section className="rx-page-head compact"><div><div className="rx-kicker">TRACKING / 03</div><h1 className="rx-display">My complaints.</h1><p className="rx-lede">Every submission, status and priority in one view.</p></div><Link to="/submit" className="rx-primary-btn"><span>＋</span> Write a Complaint <b>↗</b></Link></section>
    <div className="rx-rule" />
    <div className="rx-panel rx-complaints-panel">
      {loading ? <div className="rx-empty"><div className="rx-loader" /><p>Loading complaints…</p></div> : complaints.length === 0 ? <div className="rx-empty"><div className="rx-empty-icon">03</div><h3>No complaints found</h3><p>When you submit an issue, it will appear here for tracking.</p><Link to="/submit" className="rx-primary-btn small">Write your first complaint ↗</Link></div> : <div className="rx-table-wrap"><table className="rx-table detailed"><thead><tr><th>Issue</th><th>Category</th><th>Priority</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>{complaints.map((c) => <tr key={c._id}><td><strong>{c.title}</strong><small>{c.description?.slice(0, 70)}{c.description?.length > 70 ? "…" : ""}</small></td><td>{c.category || "General"}</td><td><span className={`rx-priority ${(c.priority || "Medium").toLowerCase()}`}>{c.priority || "Medium"}</span></td><td><span className={`rx-status ${statusClass(c.status)}`}>{c.status || "Pending"}</span></td><td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td><td><button type="button" className="rx-delete-btn" onClick={() => handleDelete(c._id)} disabled={deletingId === c._id}>{deletingId === c._id ? "Deleting…" : "Delete"}</button></td></tr>)}</tbody></table></div>}
    </div>
  </UserLayout>;
}
