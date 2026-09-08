import { Link, useLocation } from "react-router-dom";

function UserSidebar() {
  const { pathname } = useLocation();
  const links = [
    ["/dashboard", "01", "Dashboard", "Overview & activity"],
    ["/submit", "02", "Write a Complaint", "Report an issue"],
    ["/complaints", "03", "My Complaints", "Track submissions"],
    ["/profile", "04", "Profile", "Account details"],
    ["/support", "05", "Customer Support", "AI + support team"],
  ];

  return (
    <aside className="rx-sidebar">
      <div className="rx-side-label">WORKSPACE</div>
      <div className="rx-side-title">My account</div>
      <div className="rx-side-subtitle">A simple space to report and follow issues.</div>
      <nav className="rx-side-nav">
        {links.map(([to, number, label, hint]) => (
          <Link key={to} to={to} className={`rx-side-link ${pathname === to ? "active" : ""}`}>
            <span className="rx-side-number">{number}</span>
            <span className="rx-side-link-copy"><strong>{label}</strong><small>{hint}</small></span>
            <span className="rx-side-arrow">↗</span>
          </Link>
        ))}
      </nav>
      <div className="rx-side-help">
        <span className="rx-side-help-dot" />
        <div><strong>Need something fixed?</strong><p>Write a clear complaint and add evidence when it helps.</p></div>
      </div>
      <div className="rx-side-foot">RESOLVEX / USER SPACE</div>
    </aside>
  );
}

export default UserSidebar;
