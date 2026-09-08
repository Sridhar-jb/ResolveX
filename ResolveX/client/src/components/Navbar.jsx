import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const goHome = () => navigate(isAdmin ? "/admin" : "/dashboard");

  return (
    <header className="rx-navbar">
      <div className="rx-nav-inner">
        <Link to={isAdmin ? "/admin" : "/dashboard"} className="rx-brand" aria-label="ResolveX home">
          <span className="rx-brand-mark">R<span>X</span></span>
          <span className="rx-brand-copy">
            <strong>ResolveX</strong>
            <small>{isAdmin ? "Admin control center" : "Resolution workspace"}</small>
          </span>
        </Link>

        <button type="button" className="rx-nav-search" onClick={goHome} aria-label="Open workspace">
          <span className="rx-nav-search-icon">⌕</span>
          <span className="rx-nav-search-text">Search complaints, users, categories...</span>
          <span className="rx-nav-search-shortcut">⌘ K</span>
        </button>

        <div className="rx-user-nav">
          <div className="rx-nav-online"><span /> {isAdmin ? "Operations online" : "Workspace online"}</div>
          <button type="button" className="rx-nav-bell" onClick={goHome} aria-label="Notifications">🔔<em>•</em></button>
          <div className="rx-user-chip">
            <div className="rx-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
            <div className="rx-user-copy">
              <strong>{user?.name || "User"}</strong>
              <small>{isAdmin ? "administrator" : "member"}</small>
            </div>
          </div>
          <button type="button" onClick={logout} className="rx-logout">Logout <span>↗</span></button>
        </div>
      </div>
      <div className="rx-nav-route" aria-hidden="true">{pathname.replace("/", "") || "dashboard"}</div>
    </header>
  );
}

export default Navbar;
