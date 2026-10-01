import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ThreadChat } from "../../components/Chat";
import { Avatar, Card, EmptyState, Loading, Tabs } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage, timeAgo } from "../../lib/format";
import * as chatService from "../../services/chatService";

const HELP = [
  {
    icon: "sparkles",
    title: "How routing decides an owner",
    body: "Category comes from the complaint text and the keywords you set. Priority rises when the wording says something is unsafe or blocked. Among people with matching expertise, the one with the fewest open complaints gets it.",
  },
  {
    icon: "team",
    title: "When to assign by hand",
    body: "Use manual assignment when a specific person already has context, or when someone is away and the automatic pick would stall. Up to five people can hold one complaint.",
  },
  {
    icon: "flag",
    title: "Closing a complaint well",
    body: "Set the status and write a note. The note is what the reporter sees in their notification, so say what was done rather than just Resolved.",
  },
  {
    icon: "history",
    title: "Finding what happened",
    body: "Audit logs hold every sign-in, assignment, status change and deletion, with the person and timestamp. Search by name, action or reference.",
  },
];

function Inbox() {
  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState({ customer: null, messages: [] });
  const [sending, setSending] = useState(false);

  const loadList = useCallback(async () => {
    const data = await chatService.conversations();
    setConversations(data.conversations);
    return data.conversations;
  }, []);

  useEffect(() => {
    loadList()
      .then((rows) => {
        if (rows.length && !active) setActive(rows[0].userId);
      })
      .catch(() => setConversations([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadList]);

  const loadThread = useCallback(async () => {
    if (!active) return;
    const data = await chatService.thread(active);
    setThread({ customer: data.customer, messages: data.messages });
  }, [active]);

  useEffect(() => {
    loadThread().catch(() => setThread({ customer: null, messages: [] }));
    const timer = setInterval(() => loadThread().catch(() => {}), 20000);
    return () => clearInterval(timer);
  }, [loadThread]);

  const send = async (text) => {
    setSending(true);
    try {
      const data = await chatService.reply(active, text);
      setThread((state) => ({ ...state, messages: [...state.messages, data.message] }));
      await loadList();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  if (!conversations) return <Loading label="Loading customer messages" />;

  if (conversations.length === 0) {
    return (
      <Card flush>
        <EmptyState
          icon="chat"
          title="No customer messages yet"
          message="When someone writes in from their support page, the thread appears here."
        />
      </Card>
    );
  }

  return (
    <div className="grid-split">
      <Card title="Conversations" subtitle={`${conversations.length} threads`} flush>
        {conversations.map((row) => (
          <button
            key={row.userId}
            type="button"
            className={`list-row${row.userId === active ? " is-selected" : ""}${row.unread ? " is-unread" : ""}`}
            style={{ width: "100%", background: "none", border: 0, borderBottom: "1px solid var(--line)", textAlign: "left" }}
            onClick={() => setActive(row.userId)}
          >
            <Avatar name={row.name || "Deleted user"} color={row.avatarColor} size="sm" />
            <span className="list-row__text">
              <strong>{row.name || "Deleted user"}</strong>
              <span>{row.lastText}</span>
            </span>
            <span className="faint small nowrap">{timeAgo(row.lastAt)}</span>
          </button>
        ))}
      </Card>

      <Card
        title={thread.customer?.name || "Conversation"}
        subtitle={thread.customer?.email}
        action={
          active ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={async () => {
                try {
                  await chatService.deleteConversation(active);
                  toast.success("Conversation deleted.");
                  const rows = await loadList();
                  setActive(rows[0]?.userId || null);
                  setThread({ customer: null, messages: [] });
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }}
            >
              Delete thread
            </button>
          ) : null
        }
        flush
      >
        <ThreadChat
          messages={thread.messages}
          meRole="admin"
          onSend={send}
          sending={sending}
          placeholder="Reply to this customer"
          emptyText="No messages in this thread yet."
        />
      </Card>
    </div>
  );
}

export default function AdminSupport() {
  const [tab, setTab] = useState("inbox");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Help and support</h1>
          <p>Answer the people who wrote in, or read how the desk is meant to work.</p>
        </div>
        <div className="page-head__actions">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "inbox", label: "Customer messages" },
              { value: "guide", label: "How ResolveX works" },
            ]}
          />
        </div>
      </div>

      {tab === "inbox" ? (
        <Inbox />
      ) : (
        <div className="grid-2">
          <Card title="Running the desk" subtitle="The parts people ask about most.">
            <div className="timeline">
              {HELP.map((item) => (
                <div className="timeline__item" key={item.title}>
                  <span className="timeline__dot">
                    <Icon name={item.icon} size={13} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Setting things up" subtitle="Where each control lives.">
            <div className="stack-sm">
              <div className="meta">
                <span>Categories and keywords</span>
                <strong>Category management</strong>
              </div>
              <div className="meta">
                <span>Who can be assigned work</span>
                <strong>Team and roles</strong>
              </div>
              <div className="meta">
                <span>Automatic routing and registration</span>
                <strong>System settings</strong>
              </div>
              <div className="meta">
                <span>Exports for a meeting</span>
                <strong>Reports</strong>
              </div>
            </div>

            <p className="faint small mt">
              Nothing on these pages changes a complaint on its own. Every action is recorded in the audit log.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
