import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, Loading, PriorityPill, StatusPill, Tabs } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage, formatDate, formatDateTime } from "../../lib/format";
import * as adminService from "../../services/adminService";

const RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last quarter" },
  { value: 365, label: "Last year" },
];

const toCsv = (rows) => {
  const header = ["Reference", "Title", "Category", "Priority", "Status", "Reporter", "Filed", "Assigned"];
  const body = rows.map((row) => [
    row.reference,
    `"${(row.title || "").replace(/"/g, '""')}"`,
    row.category,
    row.priority,
    row.status,
    row.user?.name || "",
    formatDate(row.createdAt),
    `"${(row.assignedMembers || []).join(", ")}"`,
  ]);
  return [header, ...body].map((line) => line.join(",")).join("\n");
};

export default function AdminReports() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);

  useEffect(() => {
    setReport(null);
    adminService
      .report(days)
      .then((response) => setReport(response.report))
      .catch((error) => {
        toast.error(errorMessage(error));
        setReport(null);
      });
  }, [days]);

  const download = () => {
    const blob = new Blob([toCsv(report.rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resolvex-report-${days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded.");
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p>A snapshot of the desk you can export or print.</p>
        </div>
        <div className="page-head__actions">
          <Tabs value={days} onChange={setDays} items={RANGES} />
          <button type="button" className="btn btn--ghost" onClick={() => window.print()} disabled={!report}>
            <Icon name="report" size={16} />
            Print
          </button>
          <button type="button" className="btn btn--primary" onClick={download} disabled={!report}>
            <Icon name="download" size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {!report ? (
        <Loading label="Building the report" />
      ) : (
        <>
          <Card
            title={`Summary for the last ${report.rangeDays} days`}
            subtitle={`Generated ${formatDateTime(report.generatedAt)}`}
          >
            <div className="report-head">
              <div className="report-tile">
                <span>Filed</span>
                <strong>{report.counts.total}</strong>
              </div>
              <div className="report-tile">
                <span>Resolved</span>
                <strong>{report.counts.resolved}</strong>
              </div>
              <div className="report-tile">
                <span>Still pending</span>
                <strong>{report.counts.pending}</strong>
              </div>
              <div className="report-tile">
                <span>Resolution rate</span>
                <strong>{report.resolutionRate}%</strong>
              </div>
              <div className="report-tile">
                <span>Average close time</span>
                <strong>{report.avgResolutionHours} h</strong>
              </div>
            </div>

            <div className="chips mt">
              {report.categories.map((item) => (
                <span className="chip" key={item.name}>
                  {item.name}: {item.count}
                </span>
              ))}
              <span className="chip">High: {report.priorities.High}</span>
              <span className="chip">Medium: {report.priorities.Medium}</span>
              <span className="chip">Low: {report.priorities.Low}</span>
            </div>
          </Card>

          <Card title="Complaints in this period" subtitle={`${report.rows.length} rows`} flush>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Title</th>
                    <th>Reporter</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={row._id}>
                      <td className="table__ref">{row.reference}</td>
                      <td className="table__title">{row.title}</td>
                      <td>{row.user?.name || "Deleted user"}</td>
                      <td>{row.category}</td>
                      <td>
                        <PriorityPill priority={row.priority} />
                      </td>
                      <td>
                        <StatusPill status={row.status} />
                      </td>
                      <td className="nowrap small">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
