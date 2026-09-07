import { useEffect, useMemo, useRef, useState } from "react";
import {
  getConversations,
  getSupportCustomers,
  getConversationMessages,
  sendConversationMessage,
  getAdminUnreadCount,
  deleteConversationMessage,
} from "../services/chatService";

const POLL_LIST_MS = 6000;
const POLL_THREAD_MS = 4000;
const POLL_BADGE_MS = 15000;

function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function initialsOf(name) {
  return (name || "?").trim()[0]?.toUpperCase() || "?";
}

function AdminChatWidget() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const listPollRef = useRef(null);
  const threadPollRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  const refreshUnread = async () => {
    try {
      const data = await getAdminUnreadCount();
      setUnread(data?.count || 0);
    } catch (error) {
      console.error("Admin chat unread error:", error);
    }
  };

  const loadConversations = async ({ silent } = {}) => {
    if (!silent) setLoadingList(true);
    try {
      const data = await getConversations();
      setConversations(data?.conversations || []);
    } catch (error) {
      console.error("Admin chat conversations error:", error);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await getSupportCustomers();
      setCustomers(data?.customers || []);
    } catch (error) {
      console.error("Admin chat customers error:", error);
    }
  };

  const openThread = async (userId, customerPreview, { silent } = {}) => {
    setActiveUserId(userId);
    if (customerPreview) setActiveCustomer(customerPreview);
    if (!silent) setLoadingThread(true);
    try {
      const data = await getConversationMessages(userId);
      setMessages(data?.messages || []);
      if (data?.customer) setActiveCustomer(data.customer);
      scrollToBottom();
      refreshUnread();
    } catch (error) {
      console.error("Admin chat thread error:", error);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  };

  useEffect(() => {
    refreshUnread();
    const id = setInterval(() => {
      if (!open) refreshUnread();
    }, POLL_BADGE_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      loadConversations();
      loadCustomers();
      listPollRef.current = setInterval(() => loadConversations({ silent: true }), POLL_LIST_MS);
    } else {
      if (listPollRef.current) clearInterval(listPollRef.current);
      setActiveUserId(null);
      setActiveCustomer(null);
      setMessages([]);
      setShowNewChat(false);
    }
    return () => {
      if (listPollRef.current) clearInterval(listPollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && activeUserId) {
      threadPollRef.current = setInterval(() => openThread(activeUserId, null, { silent: true }), POLL_THREAD_MS);
    } else if (threadPollRef.current) {
      clearInterval(threadPollRef.current);
      threadPollRef.current = null;
    }
    return () => {
      if (threadPollRef.current) clearInterval(threadPollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeUserId]);

  const customersWithoutThread = useMemo(() => {
    const known = new Set(conversations.map((c) => String(c.userId)));
    return customers.filter((c) => !known.has(String(c._id)));
  }, [conversations, customers]);

  const handleSend = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || sending || !activeUserId) return;
    setSending(true);
    try {
      const data = await sendConversationMessage(activeUserId, value);
      if (data?.message) setMessages((prev) => [...prev, data.message]);
      setText("");
      scrollToBottom();
      loadConversations({ silent: true });
    } catch (error) {
      console.error("Admin chat send error:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    if (!activeUserId || !window.confirm("Delete this message?")) return;
    const previous = messages;
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
    try {
      await deleteConversationMessage(activeUserId, messageId);
      loadConversations({ silent: true });
    } catch (error) {
      console.error("Admin chat delete error:", error);
      setMessages(previous);
    }
  };

  return (
    <>
      <button
        type="button"
        className="rx-chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support inbox" : "Open support inbox"}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        )}
        {!open && unread > 0 && <span className="rx-chat-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="rx-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="rx-modal rx-admin-inbox" onClick={(e) => e.stopPropagation()}>
            <div className="rx-modal-head">
              <div>
                <div className="rx-kicker">CUSTOMER SUPPORT</div>
                <h2>Support inbox</h2>
                <p>Read and reply to messages from your customers.</p>
              </div>
              <button type="button" className="rx-modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>

            <div className="rx-inbox-layout">
              <div className="rx-inbox-list">
                <div className="rx-inbox-list-head">
                  <span>Conversations</span>
                  <button type="button" className="rx-small-action" onClick={() => setShowNewChat((v) => !v)}>
                    {showNewChat ? "Close" : "+ New"}
                  </button>
                </div>

                {showNewChat && (
                  <div className="rx-inbox-new">
                    {customersWithoutThread.length === 0 ? (
                      <p className="rx-inbox-empty-hint">Every registered customer already has a conversation.</p>
                    ) : (
                      customersWithoutThread.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          className="rx-inbox-new-item"
                          onClick={() => {
                            setShowNewChat(false);
                            openThread(c._id, c);
                          }}
                        >
                          <span className="rx-member-avatar">{initialsOf(c.name)}</span>
                          <span>
                            <strong>{c.name}</strong>
                            <small>{c.email}</small>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {loadingList ? (
                  <div className="rx-empty compact-empty"><div className="rx-loader" /></div>
                ) : conversations.length === 0 && !showNewChat ? (
                  <div className="rx-empty compact-empty">
                    <p>No customer conversations yet.</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.userId}
                      type="button"
                      className={`rx-inbox-item ${String(activeUserId) === String(c.userId) ? "active" : ""}`}
                      onClick={() => openThread(c.userId, { name: c.name, email: c.email })}
                    >
                      <span className="rx-member-avatar">{initialsOf(c.name)}</span>
                      <span className="rx-inbox-item-copy">
                        <strong>{c.name || "Customer"}</strong>
                        <small>{c.lastSenderRole === "admin" ? "You: " : ""}{c.lastText}</small>
                      </span>
                      {c.unreadCount > 0 && <span className="rx-chat-badge inline">{c.unreadCount}</span>}
                    </button>
                  ))
                )}
              </div>

              <div className="rx-inbox-thread">
                {!activeUserId ? (
                  <div className="rx-empty">
                    <div className="rx-empty-icon">💬</div>
                    <h3>Select a conversation</h3>
                    <p>Choose a customer on the left, or start a new conversation.</p>
                  </div>
                ) : (
                  <>
                    <div className="rx-inbox-thread-head">
                      <span className="rx-member-avatar">{initialsOf(activeCustomer?.name)}</span>
                      <div>
                        <strong>{activeCustomer?.name || "Customer"}</strong>
                        <small>{activeCustomer?.email}</small>
                      </div>
                    </div>
                    <div className="rx-chat-body inbox" ref={listRef}>
                      {loadingThread ? (
                        <div className="rx-empty compact-empty"><div className="rx-loader" /></div>
                      ) : messages.length === 0 ? (
                        <div className="rx-empty compact-empty"><p>No messages yet — say hello.</p></div>
                      ) : (
                        messages.map((m) => (
                          <div key={m._id} className={`rx-chat-bubble ${m.senderRole === "admin" ? "from-admin" : "from-user"}`}>
                            <span className="rx-chat-bubble-author">{m.senderRole === "admin" ? m.sender?.name || "You" : activeCustomer?.name || "Customer"}</span>
                            <p>{m.text}</p>
                            <div className="rx-chat-bubble-foot">
                              <time>{formatTime(m.createdAt)}</time>
                              <button
                                type="button"
                                className="rx-chat-delete"
                                onClick={() => handleDelete(m._id)}
                                aria-label="Delete message"
                                title="Delete message"
                              >
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <form className="rx-chat-input" onSubmit={handleSend}>
                      <input
                        type="text"
                        placeholder="Type a reply…"
                        value={text}
                        maxLength={2000}
                        onChange={(e) => setText(e.target.value)}
                      />
                      <button type="submit" disabled={sending || !text.trim()} aria-label="Send message">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminChatWidget;
