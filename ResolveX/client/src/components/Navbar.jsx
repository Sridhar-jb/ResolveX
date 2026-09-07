import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <header className="rx-navbar">
      <div className="rx-nav-inner">
        <Link to={isAdmin ? "/admin" : "/dashboard"} className="rx-brand">
          <span className="rx-brand-mark">R<span>X</span></span>
          <span className="rx-brand-copy">
            <strong>ResolveX</strong>
            <small>{isAdmin ? "Admin control center" : "Resolution workspace"}</small>
          </span>
        </Link>

        <div className="rx-nav-center">
          <span className="rx-status-dot" />
          <span>{isAdmin ? "Operations online" : "Issue resolution platform"}</span>
        </div>

        <div className="rx-user-nav">
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
    </header>
  );
}

export default Navbar;
