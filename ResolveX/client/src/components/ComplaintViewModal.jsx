import api from "../services/api";

const statusClass = (s = "Pending") => s.toLowerCase().replace(/\s+/g, "-");

// Complaint images are stored by the backend as paths such as /uploads/file.jpg.
// The frontend may be running on Vercel while the API is running on Render/Railway,
// so never try to load a relative /uploads URL from the frontend domain.
const getApiOrigin = () => {
  const configured = import.meta.env.VITE_API_URL;

  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }

  const base = api.defaults.baseURL || "";
  if (/^https?:\/\//i.test(base)) {
    return base.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }

  // Local development fallback.
  if (import.meta.env.DEV) return "http://localhost:5000";

  // Production fallback for the deployed ResolveX API.
  return "https://resolvex-api.onrender.com";
};

const imageUrl = (image = "") => {
  if (!image) return "";

  const value = String(image).trim();
  const apiOrigin = getApiOrigin();

  // Older complaints can contain an absolute localhost URL. Convert it to the
  // current backend so those previously uploaded images also work in production.
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)) {
        return `${apiOrigin}${parsed.pathname}${parsed.search}`;
      }
      return value;
    } catch {
      return value;
    }
  }

  return `${apiOrigin}/${value.replace(/^\/+/, "")}`;
};

const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";

export default function ComplaintViewModal({ complaint, onClose, admin = false }) {
  if (!complaint) return null;

  const ownerName = complaint.user?.name || "Unknown user";
  const ownerEmail = complaint.user?.email || "—";
  const image = imageUrl(complaint.image);

  return (
    <div className="rx-modal-backdrop" onMouseDown={onClose}>
      <div className={`rx-modal rx-view-modal ${admin ? "rx-view-admin" : "rx-view-user"}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="rx-modal-head">
          <div>
            <div className="rx-kicker">{admin ? "ADMIN VIEW / COMPLAINT" : "MY COMPLAINT / DETAILS"}</div>
            <h2>{complaint.title || "Untitled complaint"}</h2>
            <p>{admin ? "Full complaint details from the user." : "Your submitted complaint and its latest status."}</p>
          </div>
          <button className="rx-modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="rx-view-badges">
          <span className={`rx-status ${statusClass(complaint.status)}`}>{complaint.status || "Pending"}</span>
          <span className={`rx-priority ${(complaint.priority || "Medium").toLowerCase()}`}>{complaint.priority || "Medium"}</span>
          <span className="rx-view-category">{complaint.category || "General"}</span>
        </div>

        {admin && (
          <div className="rx-view-owner">
            <div className="rx-view-owner-avatar">{ownerName.charAt(0).toUpperCase()}</div>
            <div>
              <small>SUBMITTED BY</small>
              <strong>{ownerName}</strong>
              <span>{ownerEmail}</span>
            </div>
          </div>
        )}

        <div className="rx-view-grid">
          <div className="rx-view-section rx-view-description">
            <span>DESCRIPTION</span>
            <p>{complaint.description || "No description provided."}</p>
          </div>

          <div className="rx-view-section">
            <span>SUBMITTED</span>
            <p>{formatDate(complaint.createdAt)}</p>
          </div>

          <div className="rx-view-section">
            <span>LAST UPDATED</span>
            <p>{formatDate(complaint.updatedAt)}</p>
          </div>

          <div className="rx-view-section">
            <span>ASSIGNED MEMBERS</span>
            {complaint.assignedMembers?.length ? (
              <div className="rx-view-members">
                {complaint.assignedMembers.map((member, index) => <span key={`${member}-${index}`}>• {member}</span>)}
              </div>
            ) : <p className="rx-muted">Not assigned yet</p>}
          </div>

          <div className="rx-view-section">
            <span>ADMIN REMARKS</span>
            <p>{complaint.remarks || "No remarks yet."}</p>
          </div>
        </div>

        {image && (
          <div className="rx-view-section rx-view-evidence">
            <span>ATTACHED EVIDENCE</span>
            <a href={image} target="_blank" rel="noreferrer" className="rx-evidence-link">
              <img
                src={image}
                alt="Complaint evidence"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.parentElement.classList.add("rx-evidence-error");
                }}
              />
              <div className="rx-evidence-fallback">
                <strong>Evidence image could not be loaded.</strong>
                <small>Click here to try opening the original file.</small>
              </div>
            </a>
            <small>Click the image to open the full-size evidence.</small>
          </div>
        )}

        <div className="rx-modal-actions">
          <button type="button" className="rx-table-btn cyan" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
