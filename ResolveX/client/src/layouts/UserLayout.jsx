import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import Icon from "../lib/icons";
import * as chatService from "../services/chatService";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/submit", label: "Write a complaint", icon: "edit" },
  { to: "/complaints", label: "My complaints", icon: "inbox" },
  { to: "/profile", label: "Profile", icon: "user" },
  { to: "/support", label: "Customer support", icon: "chat" },
];

export default function UserLayout() {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => chatService.myUnread().then((data) => setUnread(data.count)).catch(() => {});
    load();
    const timer = setInterval(load, 45000);
    return () => clearInterval(timer);
  }, []);

  const nav = NAV.map((item) =>
    item.to === "/support" && unread ? { ...item, badge: unread } : item
  );

  return (
    <AppShell
      nav={nav}
      searchPlaceholder="Search your complaints"
      sidebarFooter={
        <div className="sidebar__card">
          <div className="sidebar__shield">
            <Icon name="bot" size={36} />
          </div>
          <h4>ResolveX assistant</h4>
          <p>Ask about a status, a category, or how routing decides who gets your issue.</p>
          <button type="button" className="btn btn--primary btn--sm btn--block" onClick={() => navigate("/support")}>
            Start a chat
          </button>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}
