import Icon from "../lib/icons";
import { formatDate } from "../lib/format";
import { Avatar, EmptyState, PriorityPill, StatusPill } from "./Ui";

/**
 * One table for both sides of the product.
 * `variant="admin"` adds the reporter column and the admin row actions.
 */
export default function ComplaintTable({
  complaints,
  variant = "user",
  onView,
  onAssign,
  onStatus,
  onDelete,
  emptyTitle = "No complaints yet",
  emptyMessage = "Anything you file shows up here with its live status.",
  emptyAction,
}) {
  if (!complaints.length) {
    return <EmptyState icon="inbox" title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }

  const isAdmin = variant === "admin";

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Complaint</th>
            {isAdmin ? <th>Reported by</th> : null}
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Date</th>
            <th className="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((complaint) => (
            <tr key={complaint._id}>
              <td className="table__ref">{complaint.reference}</td>
              <td>
                <span className="table__title">{complaint.title}</span>
                <span className="table__sub">
                  {complaint.description?.slice(0, 68)}
                  {complaint.description?.length > 68 ? "..." : ""}
                </span>
              </td>
              {isAdmin ? (
                <td>
                  <span className="row">
                    <Avatar
                      name={complaint.user?.name || "Deleted user"}
                      color={complaint.user?.avatarColor}
                      size="sm"
                    />
                    <span>
                      <span className="strong">{complaint.user?.name || "Deleted user"}</span>
                      <span className="table__sub">{complaint.user?.email}</span>
                    </span>
                  </span>
                </td>
              ) : null}
              <td>{complaint.category}</td>
              <td>
                <PriorityPill priority={complaint.priority} />
              </td>
              <td>
                <StatusPill status={complaint.status} />
              </td>
              <td>
                {complaint.assignedMembers?.length ? (
                  <span className="small">{complaint.assignedMembers.join(", ")}</span>
                ) : (
                  <span className="faint small">Unassigned</span>
                )}
              </td>
              <td className="nowrap small">{formatDate(complaint.createdAt)}</td>
              <td>
                <div className="row-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => onView(complaint)}>
                    View
                  </button>
                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => onAssign(complaint)}
                        title="Assign members"
                      >
                        <Icon name="team" size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => onStatus(complaint)}
                        title="Change status"
                      >
                        <Icon name="flag" size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => onDelete(complaint)}
                        title="Delete complaint"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => onDelete(complaint)}
                      title="Delete complaint"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
