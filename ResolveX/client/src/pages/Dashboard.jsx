import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Banner from "../components/Banner";
import ComplaintModal from "../components/ComplaintModal";
import { BarChart, DonutChart } from "../components/charts/Charts";
import { Card, EmptyState, Loading, PriorityPill, StatCard, StatusPill } from "../components/Ui";
import Icon from "../lib/icons";
import { categoryColor, formatDate, greeting } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import * as complaintService from "../services/complaintService";

const QUICK_ACTIONS = [
  { icon: "edit", title: "Report an issue", note: "File a complaint", to: "/submit" },
  { icon: "activity", title: "Track status", note: "Check progress", to: "/complaints" },
  { icon: "chat", title: "Talk to support", note: "Get human help", to: "/support" },
  { icon: "sparkles", title: "Ask ResolveX AI", note: "Get instant answers", to: "/support" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    const data = await complaintService.summary();
    setSummary(data.summary);
  }, []);

  useEffect(() => {
    load().catch(() => setSummary(null));
  }, [load]);

  if (!summary) return <Loading label="Building your dashboard" />;

  const progressBars = [
    { label: "All", value: summary.total, color: "#3b82f6" },
    { label: "Pending", value: summary.pending, color: "#f59e0b" },
    { label: "Active", value: summary.active, color: "#8b5cf6" },
    { label: "Resolved", value: summary.resolved, color: "#22c55e" },
  ];

  return (
    <>
      <Banner
        eyebrow="Welcome to ResolveX"
        title={`${greeting()},`}
        highlight={`${user?.name?.split(" ")[0]}.`}
        description="Track every issue from first report to final resolution."
        quote="A cleaner today, a better tomorrow."
        tags={[
          { icon: "edit", label: "Report" },
          { icon: "activity", label: "Track" },
          { icon: "check", label: "Resolve" },
        ]}
      />

      <div className="stat-grid">
        <StatCard
          tone="violet"
          icon="file"
          value={summary.total}
          label="Total complaints"
          note={summary.thisMonth ? `+${summary.thisMonth} this month` : "Nothing new this month"}
        />
        <StatCard tone="amber" icon="clock" value={summary.pending} label="Pending" note="Needs attention" />
        <StatCard tone="blue" icon="activity" value={summary.active} label="Active" note="In progress" />
        <StatCard tone="green" icon="check" value={summary.resolved} label="Resolved" note="Closed successfully" />
      </div>

      <div className="grid-2">
        <Card title="Your progress" subtitle="Every status becomes part of a live path from report to resolution.">
          <BarChart bars={progressBars} />
        </Card>

        <div className="stack">
          <Card
            title="Quick actions"
            subtitle="Get started in seconds."
            action={
              <Link to="/submit" className="btn btn--primary btn--sm">
                <Icon name="plus" size={15} />
                Write a complaint
              </Link>
            }
          >
            <div className="quick-grid">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.title} type="button" className="quick" onClick={() => navigate(action.to)}>
                  <span className="quick__icon">
                    <Icon name={action.icon} size={18} />
                  </span>
                  <span>
                    <strong>{action.title}</strong>
                    <span>{action.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Where your issues sit" subtitle="Split by category.">
            <div className="row-wrap" style={{ justifyContent: "center", gap: 22 }}>
              <DonutChart
                slices={summary.categories.map((item, index) => ({
                  name: item.name,
                  count: item.count,
                  color: categoryColor(item.name, index),
                }))}
                total={summary.total}
                caption="Total"
                size={180}
              />
              <div className="legend grow" style={{ minWidth: 150 }}>
                {summary.categories.map((item, index) => (
                  <div className="legend__row" key={item.name}>
                    <span className="legend__dot" style={{ background: categoryColor(item.name, index) }} />
                    <span>{item.name}</span>
                    <b>{item.share}%</b>
                  </div>
                ))}
                {summary.categories.length === 0 ? <p className="muted small">Nothing filed yet.</p> : null}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Recent complaints"
        subtitle="Your last few reports and where they stand."
        action={
          <Link to="/complaints" className="btn btn--ghost btn--sm">
            View all
          </Link>
        }
        flush
      >
        {summary.recent.length === 0 ? (
          <EmptyState
            title="Nothing filed yet"
            message="When something needs fixing, write it down and ResolveX takes it from there."
            action={
              <Link to="/submit" className="btn btn--primary btn--sm">
                Write your first complaint
              </Link>
            }
          />
        ) : (
          <div>
            {summary.recent.map((complaint) => (
              <div className="list-row" key={complaint._id}>
                <span className="table__ref nowrap">{complaint.reference}</span>
                <span className="list-row__text">
                  <strong>{complaint.title}</strong>
                  <span>
                    {complaint.category} - {formatDate(complaint.createdAt)}
                  </span>
                </span>
                <PriorityPill priority={complaint.priority} />
                <StatusPill status={complaint.status} />
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpenId(complaint._id)}>
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {openId ? <ComplaintModal complaintId={openId} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}
