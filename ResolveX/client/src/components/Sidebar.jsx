import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const { pathname } = useLocation();
  const links = [
    ["/admin", "01", "Dashboard", "Operations overview"],
    ["/admin/complaints", "02", "Complaints", "Manage all reports"],
    ["/profile", "03", "Profile", "Administrator details"],
  ];

  return (
    <aside className="rx-sidebar rx-admin-sidebar">
      <div className="rx-side-label">CONTROL CENTER</div>
      <div className="rx-side-title">Admin panel</div>
      <div className="rx-side-subtitle">Keep every complaint moving to resolution.</div>
      <nav className="rx-side-nav">
        {links.map(([to, number, label, hint]) => (
          <Link key={to} to={to} className={`rx-side-link ${pathname === to ? "active" : ""}`}>
            <span className="rx-side-number">{number}</span>
            <span className="rx-side-link-copy"><strong>{label}</strong><small>{hint}</small></span>
            <span className="rx-side-arrow">↗</span>
          </Link>
        ))}
      </nav>
      <div className="rx-side-help admin-help">
        <span className="rx-side-help-dot" />
        <div><strong>Operations status</strong><p>Dashboard, assignment and status controls are online.</p></div>
      </div>
      <div className="rx-side-foot">RESOLVEX / ADMIN SPACE</div>
    </aside>
  );
}

export default Sidebar;
