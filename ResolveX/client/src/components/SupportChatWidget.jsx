import { useEffect, useRef, useState } from "react";
import { getMyMessages, sendMyMessage, getMyUnreadCount, deleteMyMessage } from "../services/chatService";
import { askAI } from "../services/aiService";

const POLL_OPEN_MS = 4000;
const POLL_BADGE_MS = 15000;

function formatTime(value) {
  if (!value) return "";
  try { return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("ai");
  const [messages, setMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = () => requestAnimationFrame(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; });

  const loadMessages = async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try { const data = await getMyMessages(); setMessages(data?.messages || []); setUnread(0); scrollToBottom(); }
    catch (error) { console.error("Support chat load error:", error); }
    finally { if (!silent) setLoading(false); }
  };

  const refreshUnread = async () => {
    try { const data = await getMyUnreadCount(); setUnread(data?.count || 0); } catch { setUnread(0); }
  };

  useEffect(() => {
    const openFromNavbar = () => setOpen(true);
    window.addEventListener("resolvex:open-chat", openFromNavbar);
    refreshUnread();
    const id = setInterval(() => { if (!open) refreshUnread(); }, POLL_BADGE_MS);
    return () => { window.removeEventListener("resolvex:open-chat", openFromNavbar); clearInterval(id); };
  }, [open]);

  useEffect(() => {
    if (open && mode === "human") {
      loadMessages();
      pollRef.current = setInterval(() => loadMessages({ silent: true }), POLL_OPEN_MS);
    } else if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open, mode]);

  const handleSend = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      if (mode === "ai") {
        setAiMessages((prev) => [...prev, { role: "user", text: value, id: `${Date.now()}u` }]);
        setText("");
        const data = await askAI(value);
        setAiMessages((prev) => [...prev, { role: "ai", text: data?.reply || "I couldn't generate a response right now.", id: `${Date.now()}a` }]);
        scrollToBottom();
      } else {
        const data = await sendMyMessage(value);
        if (data?.message) setMessages((prev) => [...prev, data.message]);
        setText(""); scrollToBottom();
      }
    } catch (error) { console.error("Support chat send error:", error); }
    finally { setSending(false); }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    const previous = messages;
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
    try { await deleteMyMessage(messageId); } catch { setMessages(previous); }
  };

  return <>
    <button type="button" className="rx-chat-fab" onClick={() => setOpen((v) => !v)} aria-label="Open customer support">
      {open ? "×" : "✦"}{!open && unread > 0 && <span className="rx-chat-badge">{unread > 9 ? "9+" : unread}</span>}
    </button>

    {open && <div className="rx-chat-panel rx-ai-chat-panel">
      <div className="rx-chat-head">
        <div><div className="rx-kicker">RESOLVEX SUPPORT</div><strong>{mode === "ai" ? "ResolveX AI Assistant" : "Chat with our team"}</strong><small className="rx-ai-status">● {mode === "ai" ? "AI online · complaint-aware" : "Human support"}</small></div>
        <button type="button" className="rx-modal-close" onClick={() => setOpen(false)}>×</button>
      </div>
      <div className="rx-chat-tabs"><button className={mode === "ai" ? "active" : ""} onClick={() => setMode("ai")}>✦ AI Assistant</button><button className={mode === "human" ? "active" : ""} onClick={() => setMode("human")}>◉ Team Support</button></div>
      <div className="rx-chat-body" ref={listRef}>
        {mode === "ai" ? (
          <>
            <div className="rx-ai-welcome"><span className="rx-ai-orb">✦</span><div><strong>Hi! I'm ResolveX AI.</strong><p>I can check your complaint history, explain status and priority, and guide you to the right support.</p></div></div>
            {aiMessages.map((m) => <div key={m.id} className={`rx-chat-bubble ${m.role === "ai" ? "from-admin" : "from-user"}`}><span className="rx-chat-bubble-author">{m.role === "ai" ? "RESOLVEX AI" : "YOU"}</span><p>{m.text}</p></div>)}
          </>
        ) : loading ? <div className="rx-empty compact-empty"><div className="rx-loader"/><p>Loading conversation…</p></div> : messages.length === 0 ? <div className="rx-empty compact-empty"><div className="rx-empty-icon">💬</div><h3>Need a hand?</h3><p>Send a message and our support team will reply here.</p></div> : messages.map((m) => <div key={m._id} className={`rx-chat-bubble ${m.senderRole === "admin" ? "from-admin" : "from-user"}`}><span className="rx-chat-bubble-author">{m.senderRole === "admin" ? m.sender?.name || "Support" : "You"}</span><p>{m.text}</p><div className="rx-chat-bubble-foot"><time>{formatTime(m.createdAt)}</time>{m.senderRole === "user" && <button type="button" className="rx-chat-delete" onClick={() => handleDelete(m._id)}>⌫</button>}</div></div>)}
      </div>
      <form className="rx-chat-input" onSubmit={handleSend}><input autoFocus placeholder={mode === "ai" ? "Ask AI about your complaint…" : "Type your message…"} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)}/><button type="submit" disabled={sending || !text.trim()}>{sending ? "…" : "➤"}</button></form>
      {mode === "ai" && <div className="rx-ai-note">AI uses your ResolveX complaint history. For urgent matters, contact Team Support.</div>}
    </div>}
  </>;
}
export default SupportChatWidget;
