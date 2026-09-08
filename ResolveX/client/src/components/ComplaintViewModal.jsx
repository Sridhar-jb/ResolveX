import { useEffect, useRef, useState } from "react";
import {
  getMyMessages,
  sendMyMessage,
  deleteMyMessage,
  deleteMyChat,
  getConversationMessages,
  sendConversationMessage,
  deleteConversationMessage,
  deleteConversation,
} from "../services/chatService";
import { askAI } from "../services/aiService";
import api from "../services/api";

const fmtTime = (v) => {
  try { return new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};
const statusClass = (s = "Pending") => s.toLowerCase().replace(/\s+/g, "-");

function useEvidenceSrc(complaint) {
  const [src, setSrc] = useState(null);
  const [status, setStatus] = useState("none"); // none | loading | ready | error

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const id = complaint?._id;
    const image = complaint?.image;
    const imageContentType = complaint?.imageContentType;
    const baseUrl = String(api.defaults.baseURL || "").replace(/\/api\/?$/, "");

    setSrc(null);
    setStatus("none");

    if (!id) return undefined;

    // New persistent evidence can be returned inline by the complaint detail API.
    if (typeof image === "string" && image.startsWith("data:image/")) {
      setSrc(image);
      setStatus("ready");
      return undefined;
    }

    const hasLegacyPath = typeof image === "string" && image.startsWith("/uploads/");
    const hasPersistentImage = Boolean(imageContentType);

    if (!hasLegacyPath && !hasPersistentImage) {
      setStatus("none");
      return undefined;
    }

    const loadEvidence = async () => {
      setStatus("loading");

      // First try the old public /uploads URL when this is a legacy complaint.
      // This keeps older evidence working when the original file still exists.
      if (hasLegacyPath && baseUrl) {
        const legacyUrl = `${baseUrl}${image}`;
        const probe = new Image();
        probe.onload = () => {
          if (cancelled) return;
          setSrc(legacyUrl);
          setStatus("ready");
        };
        probe.onerror = () => {
          if (!cancelled) fetchProtectedEvidence();
        };
        probe.src = legacyUrl;
        return;
      }

      await fetchProtectedEvidence();
    };

    const fetchProtectedEvidence = async () => {
      try {
        const res = await api.get(`/complaints/${id}/evidence`, {
          responseType: "blob",
          validateStatus: () => true,
        });

        if (cancelled) return;

        const contentType = String(res.headers?.["content-type"] || res.data?.type || "").toLowerCase();
        if (res.status < 200 || res.status >= 300 || !contentType.startsWith("image/")) {
          throw new Error(`Evidence endpoint returned ${res.status}`);
        }

        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
        setStatus("ready");
      } catch (error) {
        console.error("Evidence image load failed:", error);
        if (!cancelled) {
          setSrc(null);
          setStatus("error");
        }
      }
    };

    loadEvidence();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [complaint?._id, complaint?.image, complaint?.imageContentType]);

  return { src, status };
}

function SupportPanel({ admin, userId, customer }) {
  const [mode, setMode] = useState(admin ? "ai" : "support");
  const [messages, setMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const scrollBottom = () => requestAnimationFrame(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  });

  const loadSupport = async () => {
    if (!userId) return;
    try {
      const data = admin
        ? await getConversationMessages(userId)
        : await getMyMessages();
      setMessages(data?.messages || []);
      scrollBottom();
    } catch (e) { console.error("Support panel error:", e); }
  };

  useEffect(() => {
    if (mode !== "support") return;
    setLoading(true);
    loadSupport().finally(() => setLoading(false));
    const timer = setInterval(loadSupport, 4000);
    return () => clearInterval(timer);
  }, [mode, userId, admin]);

  const send = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      if (mode === "ai") {
        setAiMessages((p) => [...p, { id: `${Date.now()}u`, role: "user", text: value }]);
        setText("");
        const data = await askAI(value);
        setAiMessages((p) => [...p, { id: `${Date.now()}a`, role: "ai", text: data?.reply || "I could not generate a response." }]);
      } else {
        const data = admin
          ? await sendConversationMessage(userId, value)
          : await sendMyMessage(value);
        if (data?.message) setMessages((p) => [...p, data.message]);
        setText("");
      }
      scrollBottom();
    } catch (e) {
      console.error("Support send error:", e);
    } finally { setSending(false); }
  };

  const removeMessage = async (id) => {
    const old = messages;
    setMessages((p) => p.filter((m) => m._id !== id));
    try {
      if (admin) await deleteConversationMessage(userId, id);
      else await deleteMyMessage(id);
    } catch { setMessages(old); }
  };

  const clearChat = async () => {
    if (!messages.length || !window.confirm("Delete this entire support chat?")) return;
    const old = messages;
    setMessages([]);
    try {
      if (admin) await deleteConversation(userId);
      else await deleteMyChat();
    } catch { setMessages(old); }
  };

  return (
    <aside className="rx-complaint-support">
      <div className="rx-support-panel-head">
        <div className="rx-support-brand">
          <span className="rx-support-icon">✦</span>
          <div>
            <strong>AI Assist &amp; Customer Support</strong>
            <small>AI + Human Support</small>
          </div>
        </div>
        <span className="rx-support-spark">✦</span>
      </div>

      <div className="rx-support-tabs">
        {admin && <button className={mode === "ai" ? "active" : ""} onClick={() => setMode("ai")}>▣ AI Assistant</button>}
        <button className={mode === "support" ? "active" : ""} onClick={() => setMode("support")}>◉ Customer Support</button>
      </div>

      {mode === "support" && (
        <div className="rx-support-customer">
          <span className="rx-member-avatar">{(customer?.name || "C").charAt(0).toUpperCase()}</span>
          <div><strong>{admin ? customer?.name || "Customer" : "ResolveX Admin Support"}</strong><small>{admin ? customer?.email : "Messages are read by the admin team"}</small></div>
          <span className="rx-online-dot">●</span>
        </div>
      )}

      <div className="rx-support-messages" ref={listRef}>
        {mode === "ai" ? (
          <>
            <div className="rx-support-msg incoming"><span className="rx-ai-mini">AI</span><div><b>ResolveX AI <time>now</time></b><p>Hello! I can help with complaints, status updates and general ResolveX questions. How can I assist you today?</p></div></div>
            {aiMessages.map((m) => <div key={m.id} className={`rx-support-msg ${m.role === "ai" ? "incoming" : "outgoing"}`}><span className="rx-ai-mini">{m.role === "ai" ? "AI" : "You"}</span><div><b>{m.role === "ai" ? "ResolveX AI" : "You"} <time>now</time></b><p>{m.text}</p></div></div>)}
          </>
        ) : loading ? (
          <div className="rx-support-empty"><div className="rx-loader" /><p>Loading messages…</p></div>
        ) : messages.length === 0 ? (
          <div className="rx-support-empty"><span>💬</span><h3>{admin ? "No messages yet" : "Start a conversation"}</h3><p>{admin ? "Reply to the customer from this panel." : "Send a message to the admin support team."}</p></div>
        ) : messages.map((m) => {
          const incoming = admin ? m.senderRole === "user" : m.senderRole === "admin";
          return <div key={m._id} className={`rx-support-msg ${incoming ? "incoming" : "outgoing"}`}>
            <span className={incoming ? "rx-customer-mini" : "rx-ai-mini"}>{incoming ? (admin ? (customer?.name || "U").charAt(0).toUpperCase() : "A") : (admin ? "A" : "You")}</span>
            <div><b>{incoming ? (admin ? customer?.name || "Customer" : "Admin Support") : (admin ? "You" : "You")} <time>{fmtTime(m.createdAt)}</time></b><p>{m.text}</p>
              <div className="rx-message-actions"><time>{fmtTime(m.createdAt)}</time><button onClick={() => removeMessage(m._id)} title="Delete message">⌫</button></div>
            </div>
          </div>;
        })}
      </div>

      <form className="rx-support-compose" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={mode === "ai" ? "Ask AI about this complaint…" : admin ? "Reply to customer…" : "Type your message…"} />
        <button disabled={sending || !text.trim()} aria-label="Send">➤</button>
      </form>

      <div className="rx-support-footer">
        <span>{mode === "support" ? (admin ? "Customer messages are marked read when opened." : "Admin can read and reply to your messages.") : "AI support is available anytime."}</span>
        {mode === "support" && <button onClick={clearChat} disabled={!messages.length}>Delete Chat</button>}
      </div>
    </aside>
  );
}

export default function ComplaintViewModal({
  complaint,
  onClose,
  admin = false,
  onAssignClick,
  onStatusClick,
  onDeleteClick,
  complaints = [],
  currentIndex = -1,
  onNavigate,
  navLoading = false,
}) {
  // Lock the page behind the full-screen workspace from scrolling while
  // it's open, and stop wheel/touch scroll from chaining into it once the
  // inner panel hits the top/bottom of its own content.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const { src: evidenceSrc, status: evidenceStatus } = useEvidenceSrc(complaint);
  const [evidenceImageBroken, setEvidenceImageBroken] = useState(false);

  useEffect(() => { setEvidenceImageBroken(false); }, [evidenceSrc]);

  if (!complaint) return null;

  const ownerName = complaint.user?.name || "Unknown user";
  const ownerEmail = complaint.user?.email || "—";

  const hasList = Array.isArray(complaints) && complaints.length > 0 && currentIndex > -1;
  const canPrev = hasList && currentIndex > 0 && !navLoading;
  const canNext = hasList && currentIndex < complaints.length - 1 && !navLoading;

  const downloadName = () => {
    const type = complaint.imageContentType || "";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("gif") ? "gif" : "jpg";
    return `evidence-${String(complaint._id || "complaint").slice(-8)}.${ext}`;
  };

  return (
    <div className="rx-full-complaint-backdrop">
      <div className="rx-full-complaint">
        <header className="rx-full-topbar">
          <div className="rx-full-brand"><span>R<br/>X</span><strong>ResolveX</strong><small>{admin ? "Admin control center" : "Customer portal"}</small></div>
          <div className="rx-full-search">⌕ <span>Search complaints, users, categories...</span></div>
          <div className="rx-full-online">● Operations online</div>
          <div className="rx-full-user"><span>{admin ? "S" : ownerName.charAt(0).toUpperCase()}</span><div><strong>{admin ? "Administrator" : "You"}</strong><small>{admin ? "Admin" : ownerEmail}</small></div></div>
        </header>

        <div className="rx-full-layout">
          <main className="rx-full-main">
            <div className="rx-full-nav">
              <button onClick={onClose}>← Back to Complaints</button>
              <div>
                <button disabled={!canPrev} onClick={() => onNavigate?.(currentIndex - 1)}>← Previous</button>
                <span>{hasList ? (navLoading ? "Loading…" : `${currentIndex + 1} of ${complaints.length}`) : "Complaint"}</span>
                <button disabled={!canNext} onClick={() => onNavigate?.(currentIndex + 1)}>Next →</button>
              </div>
            </div>

            <section className="rx-complaint-card">
              <div className="rx-complaint-card-head">
                <div>
                  <div className="rx-id-row"><span>▣ #{String(complaint._id || "").slice(-8).toUpperCase()}</span><b className={`rx-status ${statusClass(complaint.status)}`}>{complaint.status || "Pending"}</b></div>
                  <h1>{complaint.title || "Untitled complaint"}</h1>
                  <p>{complaint.description?.slice(0, 100) || "Complaint details"}</p>
                </div>
                {admin && <div className="rx-detail-actions"><span>Submitted on {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "—"}</span><button onClick={onStatusClick}>Edit Status</button><button onClick={onAssignClick}>Assign</button><button className="danger" onClick={onDeleteClick}>Delete</button></div>}
              </div>

              <div className="rx-detail-stat-grid">
                <div><small>Submitted by</small><div className="rx-person"><span>{ownerName.charAt(0).toUpperCase()}</span><b>{ownerName}</b><em>{ownerEmail}</em></div></div>
                <div><small>Category</small><strong>◫ {complaint.category || "General"}</strong></div>
                <div><small>Priority</small><strong className={`rx-priority-text ${(complaint.priority || "Medium").toLowerCase()}`}>⌁ {complaint.priority || "Medium"}</strong></div>
                <div><small>Status</small><strong className="rx-status-text">◉ {complaint.status || "Pending"}</strong></div>
              </div>

              <div className="rx-detail-meta-grid">
                <div><small>Submitted</small><strong>▣ {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "—"}</strong></div>
                <div><small>Last Updated</small><strong>◷ {complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : "—"}</strong></div>
                <div><small>Assigned Members</small><div className="rx-member-lines">{complaint.assignedMembers?.length ? complaint.assignedMembers.map((m,i)=><span key={i}>• {m}</span>) : <span>Not assigned</span>}</div></div>
              </div>

              <div className="rx-detail-description"><small>DESCRIPTION</small><p>{complaint.description || "No description provided."}</p></div>

              <div className="rx-detail-bottom">
                <div className="rx-detail-remarks"><small>ADMIN REMARKS</small><p>{complaint.remarks || "No remarks yet."}</p></div>
                <div className="rx-detail-evidence">
                  <div className="rx-evidence-title">
                    <small>ATTACHED EVIDENCE</small>
                    {evidenceStatus === "ready" && <a href={evidenceSrc} target="_blank" rel="noreferrer">↗ Open full size</a>}
                  </div>

                  {evidenceStatus === "ready" && !evidenceImageBroken && (
                    <a className="rx-detail-image-wrap" href={evidenceSrc} target="_blank" rel="noreferrer">
                      <img src={evidenceSrc} alt="Complaint evidence" onError={() => setEvidenceImageBroken(true)} />
                    </a>
                  )}
                  {evidenceStatus === "ready" && evidenceImageBroken && (
                    <div className="rx-detail-image-wrap failed">
                      <div className="rx-image-fallback"><b>Evidence image unavailable</b><span>The server returned an invalid image response.</span></div>
                    </div>
                  )}
                  {evidenceStatus === "loading" && (
                    <div className="rx-detail-image-wrap loading"><div className="rx-loader" /></div>
                  )}
                  {evidenceStatus === "error" && (
                    <div className="rx-detail-image-wrap failed">
                      <div className="rx-image-fallback"><b>Evidence image unavailable</b><span>For older uploads, the original file may no longer exist on the server.</span></div>
                    </div>
                  )}
                  {evidenceStatus === "none" && (
                    <div className="rx-detail-image-wrap empty">
                      <div className="rx-image-fallback"><b>No evidence attached</b><span>The submitter did not upload a photo with this complaint.</span></div>
                    </div>
                  )}

                  {evidenceStatus === "ready" && (
                    <div className="rx-evidence-footer">
                      <small className="rx-image-hint">Click the image to open it in full size.</small>
                      <a className="rx-evidence-download" href={evidenceSrc} download={downloadName()}>⬇ Download</a>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </main>
          <SupportPanel admin={admin} userId={complaint.user?._id || complaint.user} customer={{name: ownerName, email: ownerEmail}} />
        </div>
      </div>
    </div>
  );
}
