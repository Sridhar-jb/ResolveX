import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ComplaintTable from "../components/ComplaintTable";
import ComplaintModal from "../components/ComplaintModal";
import { Card, ConfirmDialog, Loading, Tabs } from "../components/Ui";
import Icon from "../lib/icons";
import { errorMessage, STATUSES } from "../lib/format";
import * as complaintService from "../services/complaintService";

export default function MyComplaints() {
  const [params, setParams] = useSearchParams();
  const [complaints, setComplaints] = useState(null);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState(params.get("search") || "");
  const [openId, setOpenId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await complaintService.listMine();
    setComplaints(data.complaints);
  }, []);

  useEffect(() => {
    load().catch((error) => {
      toast.error(errorMessage(error));
      setComplaints([]);
    });
  }, [load]);

  useEffect(() => {
    const term = params.get("search") || "";
    setSearch(term);
  }, [params]);

  const counts = useMemo(() => {
    const base = { All: complaints?.length || 0 };
    STATUSES.forEach((item) => {
      base[item] = complaints?.filter((row) => row.status === item).length || 0;
    });
    return base;
  }, [complaints]);

  const visible = useMemo(() => {
    if (!complaints) return [];
    const term = search.trim().toLowerCase();
    return complaints.filter((complaint) => {
      const matchesStatus = status === "All" || complaint.status === status;
      const matchesTerm =
        !term ||
        complaint.title.toLowerCase().includes(term) ||
        complaint.description.toLowerCase().includes(term) ||
        complaint.reference.toLowerCase().includes(term) ||
        complaint.category.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [complaints, status, search]);

  const remove = async () => {
    setBusy(true);
    try {
      await complaintService.remove(pendingDelete._id);
      toast.success("Complaint deleted.");
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (!complaints) return <Loading label="Loading your complaints" />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My complaints</h1>
          <p>Track, monitor and stay updated. All your submissions in one place.</p>
        </div>
        <div className="page-head__actions">
          <Link to="/submit" className="btn btn--primary">
            <Icon name="plus" size={16} />
            New complaint
          </Link>
        </div>
      </div>

      <Card flush>
        <div className="row-between" style={{ padding: "16px 20px", flexWrap: "wrap" }}>
          <Tabs
            value={status}
            onChange={setStatus}
            items={[
              { value: "All", label: "All", count: counts.All },
              ...STATUSES.map((item) => ({ value: item, label: item, count: counts[item] })),
            ]}
          />
          <div className="search" style={{ maxWidth: 260 }}>
            <Icon name="search" size={16} className="search__icon" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setParams(event.target.value ? { search: event.target.value } : {}, { replace: true });
              }}
              placeholder="Search your complaints"
              aria-label="Search your complaints"
            />
          </div>
        </div>

        <ComplaintTable
          complaints={visible}
          onView={(complaint) => setOpenId(complaint._id)}
          onDelete={(complaint) => setPendingDelete(complaint)}
          emptyTitle={complaints.length ? "Nothing matches that filter" : "No complaints yet"}
          emptyMessage={
            complaints.length
              ? "Try another status or clear the search."
              : "When something needs fixing, file it and follow it here."
          }
          emptyAction={
            complaints.length ? null : (
              <Link to="/submit" className="btn btn--primary btn--sm">
                Write your first complaint
              </Link>
            )
          }
        />
      </Card>

      {openId ? <ComplaintModal complaintId={openId} onClose={() => setOpenId(null)} /> : null}

      {pendingDelete ? (
        <ConfirmDialog
          title={`Delete ${pendingDelete.reference}?`}
          message={pendingDelete.title}
          busy={busy}
          onConfirm={remove}
          onClose={() => setPendingDelete(null)}
        />
      ) : null}
    </>
  );
}
