import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, EmptyState, Loading, Pagination } from "../../components/Ui";
import Icon from "../../lib/icons";
import { errorMessage, formatDateTime } from "../../lib/format";
import * as adminService from "../../services/adminService";

export default function AdminAudit() {
  const [state, setState] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const data = await adminService.auditLogs({ search, page, limit: 25 });
    setState(data);
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load().catch((error) => {
        toast.error(errorMessage(error));
        setState({ logs: [], page: 1, pages: 1, total: 0 });
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  if (!state) return <Loading label="Loading the audit trail" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit logs</h1>
          <p>Who did what, and when. Sign-ins, assignments, status changes and deletions.</p>
        </div>
      </div>

      <Card flush>
        <div style={{ padding: "16px 20px" }}>
          <div className="search" style={{ maxWidth: 360 }}>
            <Icon name="search" size={16} className="search__icon" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search by action, person or detail"
              aria-label="Search audit log"
            />
          </div>
        </div>

        {state.logs.length === 0 ? (
          <EmptyState icon="history" title="No entries match" message="Try a different search term." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>Detail</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {state.logs.map((log) => (
                  <tr key={log._id}>
                    <td className="nowrap small">{formatDateTime(log.createdAt)}</td>
                    <td>
                      <span className="table__title">{log.actorName}</span>
                      <span className="table__sub">{log.actorRole}</span>
                    </td>
                    <td>{log.action}</td>
                    <td className="small">{log.detail || "-"}</td>
                    <td className="small faint">{log.entity || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={state.page} pages={state.pages} total={state.total} onChange={setPage} />
      </Card>
    </>
  );
}
