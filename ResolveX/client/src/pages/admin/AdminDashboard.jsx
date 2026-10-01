import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Banner from "../../components/Banner";
import ComplaintModal from "../../components/ComplaintModal";
import { DonutChart, LineChart } from "../../components/charts/Charts";
import { Avatar, Card, EmptyState, Loading, PriorityPill, ProgressRow, StatCard, StatusPill } from "../../components/Ui";
import Icon from "../../lib/icons";
import { categoryColor, formatDate, timeAgo } from "../../lib/format";
import * as adminService from "../../services/adminService";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    adminService
      .overview()
      .then((response) => setData(response.overview))
      .catch(() => setData(null));
    adminService
      .health()
      .then((response) => setHealth(response.health))
      .catch(() => setHealth(null));
  }, []);

  if (!data) return <Loading label="Loading the control centre" />;

  const { counts, series, categories, recent, activity, team, trend, avgResolutionHours, totalUsers } = data;
  const maxStatus = Math.max(counts.pending, counts.assigned, counts.inProgress, counts.resolved, 1);

  return (
    <>
      <Banner
        eyebrow="Admin control centre"
        title="Command"
        highlight="Change."
        description="Monitor, manage and resolve complaints for a safer, smarter community."
        quote="Transparency today, a better tomorrow."
        quoteBy="ResolveX"
        tags={[
          { icon: "eye", label: "Monitor" },
          { icon: "layers", label: "Manage" },
          { icon: "check", label: "Resolve" },
          { icon: "sparkles", label: "Empower" },
        ]}
      />

      <div className="stat-grid">
        <StatCard
          tone="blue"
          icon="file"
          value={counts.total}
          label="Total complaints"
          note={`${trend.change >= 0 ? "+" : ""}${trend.change}% from last week`}
        />
        <StatCard tone="rose" icon="clock" value={counts.pending} label="Pending" note="Needs attention" />
        <StatCard tone="cyan" icon="team" value={counts.assigned} label="Assigned" note="With team members" />
        <StatCard tone="green" icon="check" value={counts.resolved} label="Resolved" note="Closed successfully" />
      </div>

      <div className="grid-3">
        <Card title="Complaint statistics" subtitle="Last 30 days" flush>
          <div style={{ padding: "18px 12px 0" }}>
            <LineChart
              labels={series.map((point) => point.date)}
              series={[
                { name: "Submitted", color: "#6366f1", values: series.map((point) => point.submitted) },
                { name: "Resolved", color: "#22c55e", values: series.map((point) => point.resolved) },
              ]}
            />
          </div>
          <div className="chart-legend">
            <span>
              <i style={{ background: "#6366f1" }} /> Submitted
            </span>
            <span>
              <i style={{ background: "#22c55e" }} /> Resolved
            </span>
            <span className="faint">Average resolution: {avgResolutionHours} h</span>
          </div>
        </Card>

        <Card title="Category distribution" subtitle="Where the load sits">
          <div className="row-wrap" style={{ justifyContent: "center", gap: 18 }}>
            <DonutChart
              slices={categories.map((item, index) => ({
                name: item.name,
                count: item.count,
                color: categoryColor(item.name, index),
              }))}
              total={counts.total}
              caption="Total"
              size={170}
            />
            <div className="legend grow" style={{ minWidth: 140 }}>
              {categories.slice(0, 6).map((item, index) => (
                <div className="legend__row" key={item.name}>
                  <span className="legend__dot" style={{ background: categoryColor(item.name, index) }} />
                  <span>{item.name}</span>
                  <b>{item.share}%</b>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="stack">
          <Card
            title="System status"
            subtitle={health?.maintenanceMode ? "Maintenance mode is on" : "Live and operational"}
          >
            <div className="status-grid">
              {(health?.services || []).map((service) => (
                <div className="status-tile" key={service.name}>
                  <span className="quick__icon" style={{ width: 32, height: 32 }}>
                    <Icon name={service.name === "Database" ? "database" : "layers"} size={15} />
                  </span>
                  <span>
                    <strong>{service.name}</strong>
                    <span className={service.status === "Online" ? "" : "is-off"}>{service.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Resolution pulse" subtitle={`${totalUsers} registered users`}>
            <div className="stack-sm">
              <ProgressRow label="Pending" value={counts.pending} max={maxStatus} color="#f59e0b" />
              <ProgressRow label="Assigned" value={counts.assigned} max={maxStatus} color="#3b82f6" />
              <ProgressRow label="In progress" value={counts.inProgress} max={maxStatus} color="#d946ef" />
              <ProgressRow label="Resolved" value={counts.resolved} max={maxStatus} color="#22c55e" />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid-sidebar">
        <Card
          title="Recent complaints"
          subtitle="Newest first"
          action={
            <Link to="/admin/complaints" className="btn btn--ghost btn--sm">
              Open queue
            </Link>
          }
          flush
        >
          {recent.length === 0 ? (
            <EmptyState title="The queue is empty" message="Nothing has been filed yet." />
          ) : (
            recent.map((complaint) => (
              <div className="list-row" key={complaint._id}>
                <span className="table__ref nowrap hide-sm">{complaint.reference}</span>
                <span className="list-row__text">
                  <strong>{complaint.title}</strong>
                  <span>
                    {complaint.user?.name || "Deleted user"} - {complaint.category} -{" "}
                    {formatDate(complaint.createdAt)}
                  </span>
                </span>
                <PriorityPill priority={complaint.priority} />
                <StatusPill status={complaint.status} />
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpenId(complaint._id)}>
                  View
                </button>
              </div>
            ))
          )}
        </Card>

        <div className="stack">
          <Card title="Team overview" subtitle="Who is on shift" flush>
            {team.length === 0 ? (
              <p className="muted small" style={{ padding: 20 }}>
                No team members yet. Add them under Team and roles.
              </p>
            ) : (
              team.map((member) => (
                <div className="list-row" key={member._id}>
                  <Avatar name={member.name} color="#4f46e5" size="sm" presence={member.presence} />
                  <span className="list-row__text">
                    <strong>{member.name}</strong>
                    <span>{member.role}</span>
                  </span>
                  <span className="chip">{member.presence}</span>
                </div>
              ))
            )}
            <div style={{ padding: 16 }}>
              <Link to="/admin/team" className="btn btn--primary btn--sm btn--block">
                Manage team
              </Link>
            </div>
          </Card>

          <Card title="Recent activity" subtitle="What changed lately" flush>
            {activity.length === 0 ? (
              <p className="muted small" style={{ padding: 20 }}>
                Nothing has happened yet today.
              </p>
            ) : (
              <div style={{ padding: "16px 20px" }} className="timeline">
                {activity.map((item) => (
                  <div className="timeline__item" key={item._id}>
                    <span className="timeline__dot">
                      <Icon name={item.kind === "message" ? "chat" : "activity"} size={13} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {openId ? <ComplaintModal complaintId={openId} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}
