import { useEffect, useRef, useState } from "react";
import Icon from "../lib/icons";
import { formatDateTime, errorMessage } from "../lib/format";
import * as chatService from "../services/chatService";

function useAutoScroll(dependency) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [dependency]);
  return ref;
}

/* ------------------------------ AI assistant ------------------------------ */

export function AssistantChat({ intro, suggestions = [] }) {
  const [messages, setMessages] = useState([{ role: "ai", text: intro, at: new Date().toISOString() }]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useAutoScroll(messages.length + (thinking ? 1 : 0));

  const send = async (text) => {
    const question = (text ?? draft).trim();
    if (!question || thinking) return;

    setMessages((items) => [...items, { role: "me", text: question, at: new Date().toISOString() }]);
    setDraft("");
    setThinking(true);

    try {
      const data = await chatService.ask(question);
      setMessages((items) => [...items, { role: "ai", text: data.reply, at: new Date().toISOString() }]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        { role: "ai", text: errorMessage(error, "The assistant is unreachable right now."), at: new Date().toISOString() },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat__scroll" ref={scrollRef}>
        {messages.map((message, index) => (
          <div key={index} className={`bubble bubble--${message.role === "me" ? "me" : "them"}`}>
            {message.text}
            <span className="bubble__meta">
              {message.role === "me" ? "You" : "ResolveX assistant"} - {formatDateTime(message.at)}
            </span>
          </div>
        ))}
        {thinking ? (
          <div className="bubble bubble--them">
            <span className="typing">
              <i />
              <i />
              <i />
            </span>
          </div>
        ) : null}
      </div>

      {suggestions.length ? (
        <div className="suggestions">
          {suggestions.map((item) => (
            <button key={item} type="button" className="suggestion" onClick={() => send(item)}>
              {item}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="chat__composer"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          className="input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask anything about complaints"
          aria-label="Message the assistant"
        />
        <button type="submit" className="btn btn--primary" disabled={thinking || !draft.trim()}>
          <Icon name="send" size={16} />
          Send
        </button>
      </form>
    </div>
  );
}

/* ----------------------------- human support ------------------------------ */

export function ThreadChat({ messages, meRole, onSend, sending, placeholder = "Type your message", emptyText }) {
  const [draft, setDraft] = useState("");
  const scrollRef = useAutoScroll(messages.length);

  const submit = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="chat">
      <div className="chat__scroll" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="muted center" style={{ padding: "36px 0" }}>
            {emptyText || "No messages yet. Say hello and the team will pick it up."}
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`bubble bubble--${message.senderRole === meRole ? "me" : "them"}`}
            >
              {message.text}
              <span className="bubble__meta">
                {message.senderName || (message.senderRole === "admin" ? "ResolveX support" : "Customer")} -{" "}
                {formatDateTime(message.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>

      <form className="chat__composer" onSubmit={submit}>
        <input
          className="input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label="Message"
        />
        <button type="submit" className="btn btn--primary" disabled={sending || !draft.trim()}>
          <Icon name="send" size={16} />
          Send
        </button>
      </form>
    </div>
  );
}
