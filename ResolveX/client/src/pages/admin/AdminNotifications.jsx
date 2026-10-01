import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Card, EmptyState, Loading, Tabs } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage, timeAgo } from "../../lib/format";
import * as notificationService from "../../services/notificationService";

const ICONS = {
  complaint: "file",
  status: "flag",
  assignment: "team",
  message: "chat",
  account: "user",
  system: "settings",
};

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const data = await notificationService.list(60);
    setItems(data.notifications);
  }, []);

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [load]);

  const readAll = async () => {
    try {
      await notificationService.markAllRead();
      setItems((rows) => rows.map((row) => ({ ...row, read: true })));
      toast.success("All caught up.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const open = async (item) => {
    if (!item.read) {
      await notificationService.markRead(item._id).catch(() => {});
      setItems((rows) => rows.map((row) => (row._id === item._id ? { ...row, read: true } : row)));
    }
    if (item.link) navigate(item.link);
  };

  const clear = async (item, event) => {
    event.stopPropagation();
    try {
      await notificationService.remove(item._id);
      setItems((rows) => rows.filter((row) => row._id !== item._id));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (!items) return <Loading label="Loading notifications" />;

  const visible = filter === "unread" ? items.filter((item) => !item.read) : items;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p>Everything the desk was told about, newest first.</p>
        </div>
        <div className="page-head__actions">
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              { value: "all", label: "All", count: items.length },
              { value: "unread", label: "Unread", count: items.filter((item) => !item.read).length },
            ]}
          />
          <button type="button" className="btn btn--ghost" onClick={readAll}>
            Mark all read
          </button>
        </div>
      </div>

      <Card flush>
        {visible.length === 0 ? (
          <EmptyState icon="bell" title="Nothing here" message="New complaints and messages land in this list." />
        ) : (
          visible.map((item) => (
            <div key={item._id} className={`list-row${item.read ? "" : " is-unread"}`}>
              <button
                type="button"
                className="row grow"
                style={{ background: "none", border: 0, padding: 0, textAlign: "left", color: "inherit" }}
                onClick={() => open(item)}
              >
                <span
                  className="avatar avatar--sm"
                  style={{ background: item.read ? "var(--surface-raised)" : "var(--indigo)" }}
                >
                  <Icon name={ICONS[item.kind] || "bell"} size={14} />
                </span>
                <span className="list-row__text">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </span>
              </button>
              <span className="faint small nowrap">{timeAgo(item.createdAt)}</span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                aria-label="Clear notification"
                onClick={(event) => clear(item, event)}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
