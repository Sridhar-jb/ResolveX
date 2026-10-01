import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Avatar, Card, ConfirmDialog, EmptyState, Loading } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage, formatDate } from "../../lib/format";
import * as adminService from "../../services/adminService";

const ROLES = ["user", "moderator", "support", "admin"];

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await adminService.users({ search, role });
    setUsers(data.users);
  }, [search, role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load().catch((error) => {
        toast.error(errorMessage(error));
        setUsers([]);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const changeRole = async (user, nextRole) => {
    try {
      await adminService.updateUser(user.id, { role: nextRole });
      toast.success(`${user.name} is now ${nextRole}.`);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const toggleActive = async (user) => {
    try {
      await adminService.updateUser(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? `${user.name} suspended.` : `${user.name} reinstated.`);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await adminService.removeUser(deleting.id);
      toast.success("Account and its complaints were deleted.");
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (!users) return <Loading label="Loading accounts" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Everyone with an account, what they filed, and what they can reach.</p>
        </div>
      </div>

      <Card flush>
        <div className="row-between" style={{ padding: "16px 20px", flexWrap: "wrap" }}>
          <div className="search" style={{ maxWidth: 320 }}>
            <Icon name="search" size={16} className="search__icon" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
            />
          </div>
          <select className="select" style={{ maxWidth: 190 }} value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role">
            <option value="All">All roles</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {users.length === 0 ? (
          <EmptyState icon="users" title="No accounts match" message="Try a different name, email or role." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Complaints</th>
                  <th>Joined</th>
                  <th>Last sign-in</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="row">
                        <Avatar name={user.name} color={user.avatarColor} size="sm" />
                        <span>
                          <span className="table__title">{user.name}</span>
                          <span className="table__sub">{user.email}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ minHeight: 34, padding: "6px 30px 6px 10px", fontSize: 13 }}
                        value={user.role}
                        onChange={(event) => changeRole(user, event.target.value)}
                        aria-label={`Role for ${user.name}`}
                      >
                        {ROLES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{user.complaints}</td>
                    <td className="nowrap small">{formatDate(user.createdAt)}</td>
                    <td className="nowrap small">{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</td>
                    <td>
                      <span className={`pill ${user.isActive ? "pill--resolved" : "pill--rejected"}`}>
                        {user.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleActive(user)}>
                          {user.isActive ? "Suspend" : "Reinstate"}
                        </button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(user)}>
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {deleting ? (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message="Their complaints and messages are removed with the account."
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}
