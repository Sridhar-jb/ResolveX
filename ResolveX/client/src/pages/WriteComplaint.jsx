import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Icon from "../lib/icons";
import { errorMessage, fileSize, PRIORITIES } from "../lib/format";
import { Card, Field, PriorityPill } from "../components/Ui";
import * as complaintService from "../services/complaintService";

const DRAFT_KEY = "resolvex.draft";

// Shown only if the categories request fails or comes back empty, so the
// form never leaves the person stuck with nothing to pick.
const FALLBACK_CATEGORIES = [
  { name: "Hostel", description: "Rooms, mess, wardens and hostel facilities" },
  { name: "Infrastructure", description: "Buildings, roads, lifts and campus repairs" },
  { name: "Cyber", description: "Accounts, network, portals and digital services" },
  { name: "Academic", description: "Classes, exams, marks and faculty matters" },
  { name: "Electricity", description: "Power cuts, wiring, lights and fittings" },
  { name: "Water", description: "Supply, taps, leaks and drainage" },
  { name: "Transport", description: "Buses, routes, drivers and timings" },
  { name: "Other", description: "Anything that does not fit the list" },
];

const BLANK_FORM = { title: "", description: "", category: "", priority: "Medium", location: "" };

const readDraft = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
    return saved ? { ...BLANK_FORM, ...saved } : BLANK_FORM;
  } catch {
    return BLANK_FORM;
  }
};

export default function WriteComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState(readDraft);
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // bumped to let the same file be re-picked
  const savedOnce = useRef(false);

  useEffect(() => {
    complaintService
      .categories()
      .then((data) => setCategories(data.categories?.length ? data.categories : FALLBACK_CATEGORIES))
      .catch(() => setCategories(FALLBACK_CATEGORIES));
  }, []);

  // Autosave the draft so nothing is lost if the tab closes. Skipped on the
  // very first render so an untouched draft isn't rewritten on itself.
  useEffect(() => {
    if (!savedOnce.current) {
      savedOnce.current = true;
      return;
    }
    const timer = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(form)), 400);
    return () => clearTimeout(timer);
  }, [form]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (key) => (event) => setForm((state) => ({ ...state, [key]: event.target.value }));

  const errors = useMemo(() => {
    const next = {};
    if (form.title.trim().length < 4) next.title = "Give it a title of at least 4 characters.";
    if (form.description.trim().length < 12) next.description = "Add a bit more detail (at least 12 characters).";
    if (!form.category) next.category = "Pick the closest category.";
    return next;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const attach = (candidate) => {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/")) {
      toast.error("Evidence must be an image.");
      return;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      toast.error("That image is over the 10 MB limit.");
      return;
    }
    setFile(candidate);
  };

  const removeFile = () => {
    setFile(null);
    setFileInputKey((key) => key + 1); // remount so picking the same file again still fires onChange
  };

  const clearForm = () => {
    setForm(BLANK_FORM);
    removeFile();
    localStorage.removeItem(DRAFT_KEY);
    setTouched(false);
    toast.success("Form cleared.");
  };

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) {
      toast.error("A few fields still need attention.");
      return;
    }

    setBusy(true);
    try {
      const data = await complaintService.create(form, file);
      localStorage.removeItem(DRAFT_KEY);
      toast.success(
        data.complaint.assignedMembers?.length
          ? `Filed as ${data.complaint.reference} and routed to ${data.complaint.assignedMembers.join(", ")}.`
          : `Filed as ${data.complaint.reference}. Waiting for assignment.`
      );
      navigate("/complaints");
    } catch (error) {
      toast.error(errorMessage(error, "The complaint could not be submitted."));
    } finally {
      setBusy(false);
    }
  };

  const selectedCategory = categories.find((item) => item.name === form.category);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Report an issue</h1>
          <p>One page, a couple of minutes. ResolveX routes it to the right team as soon as you submit.</p>
        </div>
      </div>

      <form className="grid-sidebar" onSubmit={submit} noValidate>
        <Card>
          <div className="stack">
            <Field label="Complaint title" hint="One line someone can recognise at a glance.">
              <input
                className="input"
                value={form.title}
                onChange={set("title")}
                onBlur={() => setTouched(true)}
                maxLength={140}
                placeholder="e.g. Water supply issue in Block B"
              />
              {touched && errors.title ? <span className="field-error">{errors.title}</span> : null}
            </Field>

            <Field
              label="Description"
              hint="What happened, where, and anything important to know."
              counter={`${form.description.length}/4000`}
            >
              <textarea
                className="textarea"
                value={form.description}
                onChange={set("description")}
                onBlur={() => setTouched(true)}
                maxLength={4000}
                placeholder="The overhead tank has been empty since Monday morning and the pump does not start."
              />
              {touched && errors.description ? <span className="field-error">{errors.description}</span> : null}
            </Field>

            <Field label="Location" hint="Optional, but it helps whoever picks this up.">
              <input
                className="input"
                value={form.location}
                onChange={set("location")}
                maxLength={160}
                placeholder="Block B, second floor"
              />
            </Field>

            <div className="field-row">
              <Field label="Category" hint={selectedCategory?.description || "Pick the closest one."}>
                <select className="select" value={form.category} onChange={set("category")} onBlur={() => setTouched(true)}>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id || category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {touched && errors.category ? <span className="field-error">{errors.category}</span> : null}
              </Field>

              <Field label="Priority" hint="Say what is unsafe or blocked and this may be raised automatically.">
                <select className="select" value={form.priority} onChange={set("priority")}>
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Evidence" hint="Optional. JPG, PNG or WEBP, up to 10 MB.">
              {!file ? (
                <div
                  className={`upload${dragging ? " is-dragging" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    attach(event.dataTransfer.files?.[0]);
                  }}
                >
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(event) => attach(event.target.files?.[0])}
                  />
                  <span className="upload__icon">
                    <Icon name="upload" size={20} />
                  </span>
                  <strong>Drag an image here, or click to choose one</strong>
                  <span>A photo makes the issue easier to confirm and close.</span>
                </div>
              ) : (
                <div className="upload-preview">
                  <img src={preview} alt="Selected evidence" />
                  <div>
                    <strong>{file.name}</strong>
                    <span>{fileSize(file.size)}</span>
                  </div>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={removeFile}>
                    Remove
                  </button>
                </div>
              )}
            </Field>
          </div>

          <div className="row-between mt">
            <button type="button" className="btn btn--ghost" onClick={clearForm}>
              Clear form
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? "Submitting" : "Submit complaint"}
              {!busy ? <Icon name="arrowRight" size={16} /> : null}
            </button>
          </div>
        </Card>

        <div className="stack">
          <Card title="Before you submit" subtitle="A live look at what will be filed.">
            <div className="stack-sm">
              <div>
                <span className="field__label">Title</span>
                <p className="mt-sm" style={{ fontSize: 14 }}>
                  {form.title || <span className="faint">Not written yet</span>}
                </p>
              </div>
              <div className="row-wrap">
                {form.category ? <span className="chip">{form.category}</span> : null}
                <PriorityPill priority={form.priority} />
                {form.location ? <span className="chip">{form.location}</span> : null}
                {file ? <span className="chip">Evidence attached</span> : null}
              </div>
            </div>
          </Card>

          <Card title="Clear in, clear out." subtitle="A better campus starts with your voice.">
            <p className="muted small" style={{ lineHeight: 1.75 }}>
              Write it the way you would tell a friend: where it is, what is broken, how long it has been that
              way. Specifics get a complaint to the right desk faster than strong words do.
            </p>

            <div className="timeline mt">
              <div className="timeline__item">
                <span className="timeline__dot">
                  <Icon name="sparkles" size={13} />
                </span>
                <div>
                  <strong>ResolveX routes it</strong>
                  <p>Category and priority are read from your words.</p>
                </div>
              </div>
              <div className="timeline__item">
                <span className="timeline__dot">
                  <Icon name="check" size={13} />
                </span>
                <div>
                  <strong>You follow it</strong>
                  <p>Every status change lands in your notifications.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
