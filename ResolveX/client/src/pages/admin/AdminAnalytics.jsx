import { useEffect, useState } from "react";
import { BarChart, DonutChart, LineChart } from "../../components/charts/Charts";
import { Card, Loading, ProgressRow, StatCard, Tabs } from "../../components/Ui";
import { categoryColor } from "../../lib/format";
import * as adminService from "../../services/adminService";

const RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    adminService
      .analytics(days)
      .then((response) => setData(response.analytics))
      .catch(() => setData(null));
  }, [days]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <p>How much is coming in, how fast it closes, and who is carrying it.</p>
        </div>
        <div className="page-head__actions">
          <Tabs value={days} onChange={setDays} items={RANGES} />
        </div>
      </div>

      {!data ? (
        <Loading label="Crunching the numbers" />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard tone="blue" icon="file" value={data.counts.total} label="Total complaints" note={`${data.trend.thisWeek} this week`} />
            <StatCard tone="green" icon="check" value={`${data.resolutionRate}%`} label="Resolution rate" note={`${data.counts.resolved} closed`} />
            <StatCard tone="cyan" icon="clock" value={`${data.avgResolutionHours} h`} label="Average time to resolve" note="From filed to closed" />
            <StatCard
              tone="violet"
              icon="arrowUp"
              value={`${data.trend.change >= 0 ? "+" : ""}${data.trend.change}%`}
              label="Week over week"
              note={`${data.trend.lastWeek} last week`}
            />
          </div>

          <Card title={`Volume over the last ${days} days`} subtitle="Submitted against resolved" flush>
            <div style={{ padding: "18px 12px 0" }}>
              <LineChart
                labels={data.series.map((point) => point.date)}
                series={[
                  { name: "Submitted", color: "#6366f1", values: data.series.map((point) => point.submitted) },
                  { name: "Resolved", color: "#22c55e", values: data.series.map((point) => point.resolved) },
                  { name: "In progress", color: "#d946ef", values: data.series.map((point) => point.inProgress) },
                ]}
                height={260}
              />
            </div>
            <div className="chart-legend">
              <span>
                <i style={{ background: "#6366f1" }} /> Submitted
              </span>
              <span>
                <i style={{ background: "#22c55e" }} /> Resolved
              </span>
              <span>
                <i style={{ background: "#d946ef" }} /> In progress
              </span>
            </div>
          </Card>

          <div className="grid-2">
            <Card title="Monthly totals" subtitle="Last six months">
              <BarChart
                bars={data.monthly.map((month) => ({ label: month.label, value: month.submitted, color: "#6366f1" }))}
              />
            </Card>

            <Card title="Category split" subtitle="Share of all complaints">
              <div className="row-wrap" style={{ justifyContent: "center", gap: 20 }}>
                <DonutChart
                  slices={data.categories.map((item, index) => ({
                    name: item.name,
                    count: item.count,
                    color: categoryColor(item.name, index),
                  }))}
                  total={data.counts.total}
                  caption="Total"
                  size={180}
                />
                <div className="legend grow" style={{ minWidth: 150 }}>
                  {data.categories.map((item, index) => (
                    <div className="legend__row" key={item.name}>
                      <span className="legend__dot" style={{ background: categoryColor(item.name, index) }} />
                      <span>{item.name}</span>
                      <b>{item.count}</b>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid-2">
            <Card title="Workload by member" subtitle="Open against resolved">
              {data.workload.length === 0 ? (
                <p className="muted small">Nothing has been assigned yet.</p>
              ) : (
                <div className="stack-sm">
                  {data.workload.map((row) => (
                    <ProgressRow
                      key={row.name}
                      label={row.name}
                      value={row.open}
                      max={Math.max(...data.workload.map((item) => item.total), 1)}
                      color="#22d3ee"
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Priority mix" subtitle="What the desk is carrying">
              <BarChart
                bars={[
                  { label: "Low", value: data.priorities.Low, color: "#22c55e" },
                  { label: "Medium", value: data.priorities.Medium, color: "#f59e0b" },
                  { label: "High", value: data.priorities.High, color: "#fb7185" },
                ]}
                height={190}
              />
            </Card>
          </div>
        </>
      )}
    </>
  );
}
