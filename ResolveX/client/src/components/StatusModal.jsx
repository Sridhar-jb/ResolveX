import { useState } from "react";
export default function StatusModal({ complaint, onUpdate, onClose }) {
  const [status, setStatus] = useState(complaint.status || "Pending");
  const [remarks, setRemarks] = useState(complaint.remarks || "");
  const submit = (e) => { e.preventDefault(); onUpdate(complaint._id, status, remarks); };
  return <div className="rx-modal-backdrop"><form onSubmit={submit} className="rx-modal small-modal">
    <div className="rx-modal-head"><div><div className="rx-kicker">STATUS UPDATE</div><h2>Update progress</h2><p>{complaint.title}</p></div><button type="button" className="rx-modal-close" onClick={onClose}>×</button></div>
    <label className="rx-modal-field">Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option>Pending</option><option>Assigned</option><option>In Progress</option><option>Resolved</option><option>Rejected</option></select></label>
    <label className="rx-modal-field">Remarks<textarea rows="5" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add a short progress note…" /></label>
    <div className="rx-modal-actions"><button type="button" className="rx-cancel" onClick={onClose}>Cancel</button><button className="rx-primary-btn">Save status ↗</button></div>
  </form></div>;
}
