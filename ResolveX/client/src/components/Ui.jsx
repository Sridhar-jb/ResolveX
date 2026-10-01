import { useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../lib/icons";
import { initials, STATUS_CLASS, PRIORITY_CLASS } from "../lib/format";

/* --------------------------------- brand ---------------------------------- */

export function Logo({ to = "/", tagline = "Report. Track. Resolve." }) {
  return (
    <Link to={to} className="brand">
      <span className="brand__mark">R</span>
      <span>
        <span className="brand__name">
          Resolve<b>X</b>
        </span>
        {tagline ? <span className="brand__tag">{tagline}</span> : null}
      </span>
    </Link>
  );
}

/* -------------------------------- avatar ---------------------------------- */

export function Avatar({ name, color = "#6366f1", size = "md", presence }) {
  return (
    <span
      className={`avatar avatar--${size}${presence ? " avatar--ring" : ""}`}
      style={{ background: color }}
      title={name}
    >
      {initials(name)}
      {presence ? <i className={`presence presence--${presence.toLowerCase()}`} /> : null}
    </span>
  );
}

/* --------------------------------- pills ---------------------------------- */

export const StatusPill = ({ status }) => (
  <span className={`pill ${STATUS_CLASS[status] || "pill--neutral"}`}>{status}</span>
);

export const PriorityPill = ({ priority }) => (
  <span className={`pill ${PRIORITY_CLASS[priority] || "pill--neutral"}`}>{priority}</span>
);

/* --------------------------------- cards ---------------------------------- */

export function Card({ title, subtitle, action, children, flush = false, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {title ? (
        <header className="card__head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={`card__body${flush ? " card__body--flush" : ""}`}>{children}</div>
    </section>
  );
}

export function StatCard({ tone = "blue", icon = "file", value, label, note }) {
  return (
    <article className={`stat stat--${tone}`}>
      <span className="stat__icon">
        <Icon name={icon} size={20} />
      </span>
      <strong className="stat__value">{value}</strong>
      <span className="stat__label">{label}</span>
      {note ? <span className="stat__note">{note}</span> : null}
    </article>
  );
}

/* --------------------------------- states --------------------------------- */

export const Loading = ({ label = "Loading" }) => (
  <div className="loading">
    <span className="spinner" />
    <span>{label}</span>
  </div>
);

export function EmptyState({ icon = "inbox", title, message, action }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={24} />
      </span>
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}

/* --------------------------------- modal ---------------------------------- */

export function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? " modal--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Delete", busy, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      subtitle={message}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Working" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="muted">This cannot be undone.</p>
    </Modal>
  );
}

/* ------------------------------- form bits -------------------------------- */

export function Field({ label, hint, children, counter }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
      {counter ? <span className="counter">{counter}</span> : null}
    </label>
  );
}

export function Toggle({ on, onChange, label, description }) {
  return (
    <div className="switch">
      <div className="switch__text">
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`toggle${on ? " is-on" : ""}`}
        onClick={() => onChange(!on)}
      />
    </div>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`tab${item.value === value ? " is-active" : ""}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count !== undefined ? ` (${item.count})` : ""}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <span>
        Page {page} of {pages} - {total} complaints
      </span>
      <div className="row">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ProgressRow({ label, value, max, color }) {
  const width = max ? Math.max(3, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress-row">
      <span>{label}</span>
      <span className="progress">
        <i style={{ width: `${width}%`, background: color }} />
      </span>
      <b>{value}</b>
    </div>
  );
}
