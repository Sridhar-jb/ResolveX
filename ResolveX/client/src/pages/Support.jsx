import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { askAI } from "../services/aiService";

const choices = [
  ["Track a complaint", "See status, priority and latest activity", "↗"],
  ["Submit an issue", "Report a new problem with optional evidence", "＋"],
  ["Understand status", "Learn what Pending, Assigned and Resolved mean", "◉"],
  ["Talk to support", "Open a conversation with the support team", "✦"],
];

export default function Support() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState("Hi! I'm ResolveX AI. Ask me anything about your complaints or how ResolveX works.");
  const [loading, setLoading] = useState(false);
  const send = async (e) => {
    e.preventDefault(); if (!text.trim() || loading) return;
    setLoading(true);
    try { const data = await askAI(text.trim()); setReply(data?.reply || "I couldn't answer that right now. Try again or open Team Support."); setText(""); }
    catch { setReply("AI support is temporarily unavailable. You can still use Team Support from the floating button."); }
    finally { setLoading(false); }
  };
  return <UserLayout>
    <section className="rx-support-hero">
      <div><div className="rx-kicker">CUSTOMER SUPPORT / 05</div><h1 className="rx-display">What do you<br/><span>need help with?</span></h1><p className="rx-lede">Choose an option below or ask ResolveX AI. Your complaint history can be used to make answers more useful.</p></div>
      <div className="rx-support-orb"><div className="rx-ai-orb-big">✦</div><div className="rx-orb-ring one"/><div className="rx-orb-ring two"/><div className="rx-orb-label">AI ONLINE</div></div>
    </section>
    <div className="rx-choice-grid">{choices.map(([title, desc, icon]) => <Link className="rx-choice-card" to={title === "Submit an issue" ? "/submit" : title === "Track a complaint" ? "/complaints" : "#ai"} key={title}><span>{icon}</span><div><h3>{title}</h3><p>{desc}</p></div><b>↗</b></Link>)}</div>
    <section id="ai" className="rx-support-ai rx-panel">
      <div className="rx-support-ai-head"><div><div className="rx-kicker">RESOLVEX AI</div><h2>Ask the assistant.</h2><p>Get a quick answer, then switch to Team Support whenever you need a person.</p></div><span className="rx-online-pill">● ONLINE</span></div>
      <div className="rx-ai-answer"><span className="rx-ai-orb">✦</span><p>{reply}</p></div>
      <form onSubmit={send} className="rx-ai-form"><input value={text} onChange={e=>setText(e.target.value)} placeholder="e.g. What does In Progress mean?"/><button disabled={loading}>{loading ? "Thinking…" : "Ask AI →"}</button></form>
    </section>
  </UserLayout>;
}
