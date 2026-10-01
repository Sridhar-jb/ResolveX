import { Link } from "react-router-dom";
import Icon from "../lib/icons";
import { Logo } from "../components/Ui";

export default function NotFound() {
  return (
    <div className="landing">
      <header className="landing__nav">
        <Logo to="/" />
      </header>
      <section className="landing__section center" style={{ display: "grid", justifyItems: "center", gap: 14 }}>
        <span className="empty__icon">
          <Icon name="search" size={24} />
        </span>
        <h2>That page is not here</h2>
        <p className="muted">The link may be old, or the page may have moved. Everything else still works.</p>
        <Link to="/" className="btn btn--primary" style={{ marginTop: 10 }}>
          Back to the start
        </Link>
      </section>
    </div>
  );
}
