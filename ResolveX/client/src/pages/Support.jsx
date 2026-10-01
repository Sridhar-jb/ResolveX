import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AssistantChat, ThreadChat } from "../components/Chat";
import { Card, Tabs } from "../components/Ui";
import Icon from "../lib/icons";
import { errorMessage } from "../lib/format";
import * as chatService from "../services/chatService";

const SUGGESTIONS = [
  "What is the status of my latest complaint?",
  "Which complaints are still pending?",
  "How is priority decided?",
  "Which category should I use?",
];

export default function Support() {
  const [tab, setTab] = useState("ai");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const data = await chatService.myThread();
    setMessages(data.messages);
  }, []);

  useEffect(() => {
    if (tab !== "human") return undefined;
    load().catch(() => setMessages([]));
    const timer = setInterval(() => load().catch(() => {}), 20000);
    return () => clearInterval(timer);
  }, [tab, load]);

  const send = async (text) => {
    setSending(true);
    try {
      const data = await chatService.sendToSupport(text);
      setMessages((items) => [...items, data.message]);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const clear = async () => {
    try {
      await chatService.clearThread();
      setMessages([]);
      toast.success("Conversation cleared.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customer support</h1>
          <p>Ask the assistant for an instant answer, or write to the support desk when you need a person.</p>
        </div>
        <div className="page-head__actions">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "ai", label: "ResolveX AI" },
              { value: "human", label: "Support desk" },
            ]}
          />
        </div>
      </div>

      <div className="grid-sidebar">
        <Card
          title={tab === "ai" ? "ResolveX assistant" : "Support desk"}
          subtitle={
            tab === "ai"
              ? "It reads your complaint history before answering."
              : "A person replies here. Replies also show in your notifications."
          }
          action={
            tab === "human" && messages.length ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={clear}>
                Clear
              </button>
            ) : null
          }
          flush
        >
          {tab === "ai" ? (
            <AssistantChat
              intro="Hi. Ask me about a complaint status, how routing works, or what to write in a new report."
              suggestions={SUGGESTIONS}
            />
          ) : (
            <ThreadChat
              messages={messages}
              meRole="user"
              onSend={send}
              sending={sending}
              placeholder="Describe what you need help with"
              emptyText="No messages yet. Write to the desk and someone will pick it up."
            />
          )}
        </Card>

        <Card title="Before you write in" subtitle="Most questions have a faster answer.">
          <div className="timeline">
            <div className="timeline__item">
              <span className="timeline__dot">
                <Icon name="clock" size={13} />
              </span>
              <div>
                <strong>Waiting on an update</strong>
                <p>Open the complaint and read the history. Each change is stamped with who made it.</p>
              </div>
            </div>
            <div className="timeline__item">
              <span className="timeline__dot">
                <Icon name="flag" size={13} />
              </span>
              <div>
                <strong>It is more urgent now</strong>
                <p>Say what changed in this chat. The desk can raise the priority.</p>
              </div>
            </div>
            <div className="timeline__item">
              <span className="timeline__dot">
                <Icon name="edit" size={13} />
              </span>
              <div>
                <strong>You left something out</strong>
                <p>Edit the complaint while it is open, or attach the detail here.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
