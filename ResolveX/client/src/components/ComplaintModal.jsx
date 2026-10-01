import { useEffect, useState } from "react";
import Icon from "../lib/icons";
import { formatDateTime } from "../lib/format";
import * as complaintService from "../services/complaintService";
import { Loading, Modal, PriorityPill, StatusPill } from "./Ui";

export default function ComplaintModal({ complaintId, onClose }) {
  const [complaint, setComplaint] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await complaintService.getOne(complaintId);
        if (cancelled) return;
        setComplaint(data.complaint);

        if (data.complaint.imageContentType) {
          objectUrl = await complaintService.evidenceUrl(complaintId);
          if (!cancelled) setEvidence(objectUrl);
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "That complaint could not be opened.");
      }
    };

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [complaintId]);

  return (
    <Modal
      wide
      title={complaint ? complaint.title : "Complaint"}
      subtitle={complaint ? `${complaint.reference} - filed ${formatDateTime(complaint.createdAt)}` : "Loading"}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Close
        </button>
      }
    >
      {error ? <p className="muted">{error}</p> : null}
      {!complaint && !error ? <Loading label="Opening complaint" /> : null}

      {complaint ? (
        <>
          <div className="row-wrap">
            <StatusPill status={complaint.status} />
            <PriorityPill priority={complaint.priority} />
            <span className="chip">{complaint.category}</span>
            {complaint.location ? <span className="chip">{complaint.location}</span> : null}
          </div>

          <div>
            <p className="field__label">What happened</p>
            <p className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
              {complaint.description}
            </p>
          </div>

          <div className="meta-grid">
            <div className="meta">
              <span>Reported by</span>
              <strong>{complaint.user?.name || "You"}</strong>
            </div>
            <div className="meta">
              <span>Assigned to</span>
              <strong>{complaint.assignedMembers?.join(", ") || "Not assigned yet"}</strong>
            </div>
            <div className="meta">
              <span>Last update</span>
              <strong>{formatDateTime(complaint.updatedAt)}</strong>
            </div>
            {complaint.resolvedAt ? (
              <div className="meta">
                <span>Resolved</span>
                <strong>{formatDateTime(complaint.resolvedAt)}</strong>
              </div>
            ) : null}
          </div>

          {complaint.remarks ? (
            <div className="notice notice--info">
              <Icon name="chat" size={17} />
              <span>
                <strong>Note from the team</strong>
                {complaint.remarks}
              </span>
            </div>
          ) : null}

          {complaint.routingReason ? (
            <p className="faint small">Routing: {complaint.routingReason}</p>
          ) : null}

          {evidence ? (
            <div>
              <p className="field__label">Evidence</p>
              <img
                src={evidence}
                alt="Evidence attached to this complaint"
                style={{ marginTop: 8, width: "100%", borderRadius: 14, border: "1px solid var(--line)" }}
              />
            </div>
          ) : null}

          {complaint.timeline?.length ? (
            <div>
              <p className="field__label">History</p>
              <div className="timeline" style={{ marginTop: 12 }}>
                {[...complaint.timeline].reverse().map((entry, index) => (
                  <div className="timeline__item" key={`${entry.at}-${index}`}>
                    <span className="timeline__dot">
                      <Icon name={entry.status === "Resolved" ? "check" : "clock"} size={14} />
                    </span>
                    <div>
                      <strong>{entry.status}</strong>
                      <p>{entry.note}</p>
                      <span>
                        {entry.byName} - {formatDateTime(entry.at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </Modal>
  );
}
