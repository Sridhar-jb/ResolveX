import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AppShell from "../components/AppShell";
import Icon from "../lib/icons";
import * as adminService from "../services/adminService";
import * as chatService from "../services/chatService";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/complaints", label: "Complaints", icon: "inbox", key: "complaints" },
  { to: "/admin/assistant", label: "AI assistant", icon: "sparkles" },
  { to: "/admin/users", label: "Users", icon: "users" },
  { to: "/admin/analytics", label: "Analytics", icon: "chart" },
  { to: "/admin/reports", label: "Reports", icon: "report" },
  { to: "/admin/categories", label: "Category management", icon: "tags" },
  { to: "/admin/team", label: "Team and roles", icon: "team" },
  { to: "/admin/settings", label: "System settings", icon: "settings" },
  { to: "/admin/notifications", label: "Notifications", icon: "bell" },
  { to: "/admin/audit", label: "Audit logs", icon: "history" },
  { to: "/admin/support", label: "Help and support", icon: "help", key: "support" },
];

export default function AdminLayout() {
  const [counts, setCounts] = useState({ complaints: 0, support: 0 });

  useEffect(() => {
    const load = async () => {
      const [overview, unread] = await Promise.all([
        adminService.overview().catch(() => null),
        chatService.adminUnread().catch(() => null),
      ]);
      setCounts({
        complaints: overview?.overview?.counts?.total || 0,
        support: unread?.count || 0,
      });
    };
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  const nav = NAV.map((item) => (item.key && counts[item.key] ? { ...item, badge: counts[item.key] } : item));

  return (
    <AppShell
      nav={nav}
      searchPlaceholder="Search complaints, users, categories"
      sidebarFooter={
        <div className="sidebar__card">
          <div className="sidebar__shield">
            <Icon name="shield" size={36} />
          </div>
          <h4>Admin shield</h4>
          <p>Every assignment, status change and sign-in is written to the audit log.</p>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}
