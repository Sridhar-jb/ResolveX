import UserLayout from "../components/UserLayout";
import AdminLayout from "../components/AdminLayout";

export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initial = user.name?.[0]?.toUpperCase() || "U";
  const content = <>
    <section className="rx-page-head compact"><div><div className="rx-kicker">ACCOUNT / {user.role === "admin" ? "03" : "04"}</div><h1 className="rx-display">Your profile.</h1><p className="rx-lede">Account details for your ResolveX workspace.</p></div></section>
    <div className="rx-rule" />
    <div className="rx-profile-grid"><div className="rx-panel rx-profile-card"><div className="rx-profile-avatar">{initial}</div><div className="rx-kicker">{user.role === "admin" ? "ADMINISTRATOR" : "MEMBER"}</div><h2>{user.name || "My Profile"}</h2><p>{user.email || "Not available"}</p></div><div className="rx-panel rx-profile-details"><div className="rx-kicker">ACCOUNT DETAILS</div><div className="rx-detail-row"><span>Name</span><strong>{user.name || "Not available"}</strong></div><div className="rx-detail-row"><span>Email</span><strong>{user.email || "Not available"}</strong></div><div className="rx-detail-row"><span>Role</span><strong className="capitalize">{user.role || "User"}</strong></div></div></div>
  </>;
  return user.role === "admin" ? <AdminLayout>{content}</AdminLayout> : <UserLayout>{content}</UserLayout>;
}
