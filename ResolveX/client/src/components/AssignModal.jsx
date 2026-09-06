import { useState } from "react";
const members = [["Ravi Kumar","Maintenance Engineer"],["Suresh Reddy","Plumbing Technician"],["Kiran Rao","Hostel Supervisor"],["Arun Sharma","Electrical Engineer"],["Priya Singh","Academic Coordinator"],["Vikram Patel","Network Technician"],["Anjali Verma","Civil Engineer"],["Naveen Kumar","Security Officer"],["Rohit Das","IT Support Engineer"],["Sneha Reddy","Facilities Manager"]];
export default function AssignModal({ complaint, onAssign, onClose }) {
  const [selected, setSelected] = useState(complaint.assignedMembers || []);
  const toggle = (name) => setSelected((p) => p.includes(name) ? p.filter((x) => x !== name) : p.length < 5 ? [...p, name] : (alert("Maximum 5 members"), p));
  const submit = (e) => { e.preventDefault(); if (!selected.length) return alert("Select at least one member"); onAssign(complaint._id, selected); };
  return <div className="rx-modal-backdrop"><form onSubmit={submit} className="rx-modal">
    <div className="rx-modal-head"><div><div className="rx-kicker">ASSIGNMENT</div><h2>Assign complaint</h2><p>{complaint.title}</p></div><button type="button" className="rx-modal-close" onClick={onClose}>×</button></div>
    <div className="rx-modal-meta"><span>{complaint.category || "General"}</span><span>{selected.length}/5 selected</span></div>
    <div className="rx-member-list">{members.map(([name, role]) => <label key={name} className={`rx-member ${selected.includes(name) ? "selected" : ""}`}><input type="checkbox" checked={selected.includes(name)} onChange={() => toggle(name)} /><span className="rx-member-avatar">{name[0]}</span><span><strong>{name}</strong><small>{role}</small></span><i>{selected.includes(name) ? "✓" : ""}</i></label>)}</div>
    <div className="rx-modal-actions"><button type="button" className="rx-cancel" onClick={onClose}>Cancel</button><button className="rx-primary-btn">Assign {selected.length || ""} member{selected.length === 1 ? "" : "s"} ↗</button></div>
  </form></div>;
}
