import { useState } from "react";
import AssignModal from "./AssignModal";
import StatusModal from "./StatusModal";
import { assignComplaint, autoAssignComplaint, updateComplaintStatus, deleteComplaintAsAdmin } from "../services/complaintService";

const statusClass = (s = "Pending") => s.toLowerCase().replace(/\s+/g, "-");

export default function ComplaintTable({ complaints = [], refreshComplaints }) {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusComplaint, setStatusComplaint] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAssign = async (id, members) => {
    try { setLoading(true); await assignComplaint(id, members); setSelectedComplaint(null); await refreshComplaints?.(); alert("Complaint assigned successfully"); }
    catch (error) { alert(error.response?.data?.message || "Failed to assign complaint"); }
    finally { setLoading(false); }
  };
  const handleAutoAssign = async (id) => {
    try { setLoading(true); const data = await autoAssignComplaint(id); await refreshComplaints?.(); alert(`${data?.message || "AI assignment complete"}\nAssigned: ${(data?.routing?.assignedMembers || []).join(", ")}`); }
    catch (error) { alert(error.response?.data?.message || "Failed to auto-assign complaint"); }
    finally { setLoading(false); }
  };
  const handleStatus = async (id, status, remarks) => {
    try { setLoading(true); await updateComplaintStatus(id, status, remarks); setStatusComplaint(null); await refreshComplaints?.(); alert("Complaint status updated successfully"); }
    catch (error) { alert(error.response?.data?.message || "Failed to update complaint status"); }
    finally { setLoading(false); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this complaint? This cannot be undone.")) return;
    try { setLoading(true); await deleteComplaintAsAdmin(id); await refreshComplaints?.(); }
    catch (error) { alert(error.response?.data?.message || "Failed to delete complaint"); }
    finally { setLoading(false); }
  };

  return <>
    <div className="rx-table-wrap">
      <table className="rx-table rx-admin-table">
        <thead><tr><th>Complaint</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Actions</th></tr></thead>
        <tbody>
          {complaints.length === 0 ? <tr><td colSpan="6"><div className="rx-empty compact-empty"><div className="rx-empty-icon">02</div><h3>No complaints found</h3><p>The current filter does not match any reports.</p></div></td></tr> : complaints.map((c) => <tr key={c._id}>
            <td><strong>{c.title || "Untitled complaint"}</strong><small>{c.user?.name || "Unknown user"}{c.user?.email ? ` · ${c.user.email}` : ""}</small></td>
            <td>{c.category || "General"}</td>
            <td><span className={`rx-priority ${(c.priority || "Medium").toLowerCase()}`}>{c.priority || "Medium"}</span></td>
            <td><span className={`rx-status ${statusClass(c.status)}`}>{c.status || "Pending"}</span></td>
            <td>{c.assignedMembers?.length ? <span className="rx-assigned-count">{c.assignedMembers.length} member{c.assignedMembers.length > 1 ? "s" : ""}</span> : <span className="rx-unassigned">Not assigned</span>}</td>
            <td><div className="rx-row-actions"><button className="rx-table-btn violet" onClick={() => handleAutoAssign(c._id)}>✦ AI Assign</button><button className="rx-table-btn cyan" onClick={() => setSelectedComplaint(c)}>Assign</button><button className="rx-table-btn amber" onClick={() => setStatusComplaint(c)}>Status</button><button className="rx-table-btn danger" onClick={() => handleDelete(c._id)}>Delete</button></div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {selectedComplaint && <AssignModal complaint={selectedComplaint} onAssign={handleAssign} onClose={() => setSelectedComplaint(null)} />}
    {statusComplaint && <StatusModal complaint={statusComplaint} onUpdate={handleStatus} onClose={() => setStatusComplaint(null)} />}
    {loading && <div className="rx-loading-overlay"><div className="rx-loading-card"><div className="rx-loader" /><strong>Updating workspace…</strong></div></div>}
  </>;
}
