import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const { pathname } = useLocation();
  const links = [
    ["/admin", "01", "Dashboard", "Operations overview"],
    ["/admin/complaints", "02", "Complaints", "Manage all reports"],
    ["/profile", "04", "Profile", "Administrator details"],
  ];

  const openSupport = () => window.dispatchEvent(new CustomEvent("resolvex:open-chat"));

  return (
    <aside className="rx-sidebar rx-admin-sidebar">
      <div className="rx-side-label">CONTROL CENTER</div>
      <div className="rx-side-title">Admin panel</div>
      <div className="rx-side-subtitle">Keep every complaint moving to resolution.</div>
      <nav className="rx-side-nav">
        {links.slice(0, 2).map(([to, number, label, hint]) => (
          <Link key={to} to={to} className={`rx-side-link ${pathname === to ? "active" : ""}`}>
            <span className="rx-side-number">{number}</span>
            <span className="rx-side-link-copy"><strong>{label}</strong><small>{hint}</small></span>
            <span className="rx-side-arrow">↗</span>
          </Link>
        ))}

        <button type="button" className="rx-side-link rx-side-button" onClick={openSupport}>
          <span className="rx-side-number">03</span>
          <span className="rx-side-link-copy"><strong>AI Assist</strong><small>Customer support inbox</small></span>
          <span className="rx-side-arrow">✦</span>
        </button>

        <Link to="/profile" className={`rx-side-link ${pathname === "/profile" ? "active" : ""}`}>
          <span className="rx-side-number">04</span>
          <span className="rx-side-link-copy"><strong>Profile</strong><small>Administrator details</small></span>
          <span className="rx-side-arrow">↗</span>
        </Link>
      </nav>
      <div className="rx-side-help admin-help">
        <span className="rx-side-help-dot" />
        <div><strong>Operations status</strong><p>Dashboard, assignment, status and customer support are online.</p></div>
      </div>
      <div className="rx-side-foot">RESOLVEX / ADMIN SPACE</div>
    </aside>
  );
}

export default Sidebar;
