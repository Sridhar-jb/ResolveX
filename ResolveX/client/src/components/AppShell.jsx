import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "../lib/icons";
import { timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import * as notificationService from "../services/notificationService";
import { Avatar, Logo } from "./Ui";

/* ------------------------------ notifications ----------------------------- */

function NotificationPanel({ items, onClose, onReadAll, onOpen }) {
  return (
    <div className="menu" style={{ width: 330 }} role="dialog" aria-label="Notifications">
      <div className="menu__head row-between">
        <strong>Notifications</strong>
        <button type="button" className="btn--link" onClick={onReadAll}>
          Mark all read
        </button>
      </div>

      {items.length === 0 ? (
        <p className="muted small" style={{ padding: "16px 12px" }}>
          Nothing new. Updates on your complaints land here.
        </p>
      ) : (
        <div style={{ maxHeight: 330, overflowY: "auto" }}>
          {items.slice(0, 8).map((item) => (
            <button
              key={item._id}
              type="button"
              className="menu__item"
              onClick={() => {
                onOpen(item);
                onClose();
              }}
              style={{ alignItems: "flex-start" }}
            >
              <span
                className="avatar avatar--sm"
                style={{ background: item.read ? "var(--surface-raised)" : "var(--indigo)" }}
              >
                <Icon name={item.kind === "message" ? "chat" : "bell"} size={14} />
              </span>
              <span className="grow">
                <strong style={{ display: "block", fontSize: 13.5 }}>{item.title}</strong>
                <span className="faint small">{item.body}</span>
                <span className="faint small" style={{ display: "block" }}>
                  {timeAgo(item.createdAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- app shell ------------------------------- */

export default function AppShell({ nav, sidebarFooter, searchPlaceholder, children }) {
  const { user, signOut, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(null); // "user" | "bell" | null
  const [term, setTerm] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const searchRef = useRef(null);
  const menuRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.list(20);
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch {
      /* the bell simply stays empty if this fails */
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const target = isAdmin ? "/admin/complaints" : "/complaints";
    navigate(term.trim() ? `${target}?search=${encodeURIComponent(term.trim())}` : target);
  };

  const readAll = async () => {
    await notificationService.markAllRead();
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    setUnread(0);
  };

  const openNotification = async (item) => {
    if (!item.read) {
      await notificationService.markRead(item._id).catch(() => {});
      setUnread((count) => Math.max(0, count - 1));
      setNotifications((items) => items.map((row) => (row._id === item._id ? { ...row, read: true } : row)));
    }
    if (item.link) navigate(item.link);
  };

  return (
    <div className="shell">
      <aside className={`sidebar${open ? " is-open" : ""}`}>
        <div className="sidebar__brand">
          <Logo to={isAdmin ? "/admin" : "/dashboard"} tagline={isAdmin ? "Admin control centre" : "Report. Track. Resolve."} />
        </div>

        <p className="sidebar__section">{isAdmin ? "Admin panel" : "Your workspace"}</p>

        <nav className="sidebar__nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `navlink${isActive ? " is-active" : ""}`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.badge ? <span className="navlink__badge">{item.badge}</span> : <span />}
            </NavLink>
          ))}
        </nav>

        {sidebarFooter}

        <p className="sidebar__foot">
          ResolveX v2.0
          <br />
          {new Date().getFullYear()} ResolveX
        </p>
      </aside>

      <button
        type="button"
        aria-label="Close navigation"
        className={`scrim${open ? " is-open" : ""}`}
        onClick={() => setOpen(false)}
      />

      <div className="main">
        <header className="topbar">
          <button type="button" className="topbar__menu" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Icon name="menu" size={20} />
          </button>

          <form className="search" onSubmit={submitSearch} role="search">
            <Icon name="search" size={17} className="search__icon" />
            <input
              ref={searchRef}
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={searchPlaceholder || "Search complaints, categories, references"}
              aria-label="Search"
            />
            <span className="search__hint">Ctrl K</span>
          </form>

          <div className="topbar__actions" ref={menuRef}>
            <button
              type="button"
              className="icon-button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>

            <div className="topbar__wrap">
              <button
                type="button"
                className="icon-button"
                onClick={() => setMenu(menu === "bell" ? null : "bell")}
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              >
                <Icon name="bell" size={18} />
                {unread > 0 ? <span className="icon-button__dot">{unread > 9 ? "9+" : unread}</span> : null}
              </button>
              {menu === "bell" ? (
                <NotificationPanel
                  items={notifications}
                  onClose={() => setMenu(null)}
                  onReadAll={readAll}
                  onOpen={openNotification}
                />
              ) : null}
            </div>

            <div className="topbar__wrap">
              <button
                type="button"
                className="user-chip"
                onClick={() => setMenu(menu === "user" ? null : "user")}
                aria-haspopup="menu"
                aria-expanded={menu === "user"}
              >
                <Avatar name={user?.name} color={user?.avatarColor} size="sm" />
                <span className="user-chip__text">
                  <strong>{user?.name}</strong>
                  <span>{isAdmin ? "Administrator" : "Member"}</span>
                </span>
              </button>

              {menu === "user" ? (
                <div className="menu" role="menu">
                  <div className="menu__head">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <button type="button" className="menu__item" onClick={() => navigate(isAdmin ? "/admin/settings" : "/profile")}>
                    <Icon name="user" size={16} />
                    {isAdmin ? "System settings" : "Your profile"}
                  </button>
                  <button
                    type="button"
                    className="menu__item"
                    onClick={() => navigate(isAdmin ? "/admin/support" : "/support")}
                  >
                    <Icon name="chat" size={16} />
                    {isAdmin ? "Customer messages" : "Customer support"}
                  </button>
                  <button
                    type="button"
                    className="menu__item is-danger"
                    onClick={() => {
                      signOut();
                      navigate("/login");
                    }}
                  >
                    <Icon name="logout" size={16} />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="page">{children}</main>
      </div>
    </div>
  );
}
