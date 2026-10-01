import { AssistantChat } from "../../components/Chat";
import { Card } from "../../components/Ui";
import Icon from "../../lib/icons";

const SUGGESTIONS = [
  "Show pending complaints",
  "Most reported category?",
  "Generate a monthly summary",
  "What should the team tackle next?",
];

export default function AdminAssistant() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>AI assistant</h1>
          <p>Ask about the desk instead of digging through filters.</p>
        </div>
      </div>

      <div className="grid-sidebar">
        <Card title="Ask ResolveX" subtitle="Answers come from live complaint data." flush>
          <AssistantChat
            intro="Ask me what needs attention, which category keeps coming back, or for a summary of the month."
            suggestions={SUGGESTIONS}
          />
        </Card>

        <Card title="What it can answer" subtitle="It reads the database, not the internet.">
          <div className="timeline">
            <div className="timeline__item">
              <span className="timeline__dot">
                <Icon name="clock" size={13} />
              </span>
              <div>
                <strong>Queue questions</strong>
                <p>What is pending, what is unassigned, what is oldest.</p>
              </div>
            </div>
            <div className="timeline__item">
              <span className="timeline__dot">
                <Icon name="chart" size={13} />
              </span>
              <div>
                <strong>Patterns</strong>
                <p>Which categories dominate and how the split is moving.</p>
              </div>
            </div>
            <div className="timeline__item">
              <span className="timeline__dot">
                <Icon name="report" size={13} />
              </span>
              <div>
                <strong>Summaries</strong>
                <p>A quick read on the month. Reports has the full export.</p>
              </div>
            </div>
          </div>

          <p className="faint small mt">
            The assistant never changes a status or an assignment. Those stay manual and audited.
          </p>
        </Card>
      </div>
    </>
  );
}
