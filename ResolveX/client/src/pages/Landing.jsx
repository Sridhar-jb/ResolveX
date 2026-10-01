import { Link } from "react-router-dom";
import Icon from "../lib/icons";
import { Logo } from "../components/Ui";
import { Mascot } from "../components/Banner";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const FEATURES = [
  {
    icon: "sparkles",
    title: "Routing that reads your words",
    body: "Category and priority come from what you wrote, then the complaint goes to whoever has the matching expertise and the lightest queue.",
  },
  {
    icon: "activity",
    title: "A status you can actually follow",
    body: "Pending, assigned, in progress, resolved. Every change is stamped with who made it and when.",
  },
  {
    icon: "chat",
    title: "Answers without the queue",
    body: "The assistant knows your complaint history. When it cannot help, a person on the support desk takes over in the same thread.",
  },
  {
    icon: "shield",
    title: "Nothing happens off the record",
    body: "Assignments, status changes and sign-ins are written to an audit log administrators can search.",
  },
];

const STEPS = [
  { title: "Write it down", body: "Title, what happened, where, and a photo if you have one. Two minutes is enough." },
  { title: "It finds its owner", body: "ResolveX picks the category, sets a priority and hands it to the right people." },
  { title: "Watch it close", body: "Follow the timeline, read the closing note, and reopen nothing because it was guessed at." },
];

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const home = user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login";

  return (
    <div className="landing">
      <header className="landing__nav">
        <Logo to="/" />
        <nav className="landing__links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#start">Get started</a>
        </nav>
        <div className="landing__nav-actions">
          <button type="button" className="icon-button" onClick={toggle} aria-label="Switch theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          {user ? (
            <Link to={home} className="btn btn--primary">
              Open ResolveX
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn btn--primary">
                Create account
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <h1>
            Report it once. <em>Then watch it move.</em>
          </h1>
          <p>
            ResolveX takes a complaint from the moment someone writes it to the moment it closes, and shows
            everyone involved exactly where it stands in between.
          </p>

          <div className="hero__actions">
            <Link to={user ? home : "/register"} className="btn btn--primary">
              <Icon name="edit" size={17} />
              File a complaint
            </Link>
            <Link to="/admin-login" className="btn btn--ghost">
              <Icon name="shield" size={17} />
              Admin sign in
            </Link>
          </div>

          <div className="hero__proof">
            <div>
              <strong>4 steps</strong>
              <span>From filed to resolved</span>
            </div>
            <div>
              <strong>8 categories</strong>
              <span>Hostel to cyber</span>
            </div>
            <div>
              <strong>Every change</strong>
              <span>Logged and timestamped</span>
            </div>
          </div>
        </div>

        <div className="hero__panel">
          <div className="hero__panel-head">
            <span>Live board</span>
            <span className="row" style={{ gap: 6 }}>
              <i className="presence presence--online" style={{ position: "static" }} />
              Operational
            </span>
          </div>

          <div className="row" style={{ justifyContent: "center" }}>
            <Mascot size={150} />
          </div>

          <div className="hero__panel-row">
            <span className="pill pill--high">High</span>
            <strong>Street light repair</strong>
            <span className="pill pill--assigned">Assigned</span>
          </div>
          <div className="hero__panel-row">
            <span className="pill pill--medium">Medium</span>
            <strong>Hostel water issue</strong>
            <span className="pill pill--progress">In progress</span>
          </div>
          <div className="hero__panel-row">
            <span className="pill pill--low">Low</span>
            <strong>Library access</strong>
            <span className="pill pill--resolved">Resolved</span>
          </div>
        </div>
      </section>

      <section className="landing__section" id="features">
        <h2>Built around the part everyone hates: waiting without news</h2>
        <p>Four things do most of the work.</p>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article className="feature" key={feature.title}>
              <span className="feature__icon">
                <Icon name={feature.icon} size={20} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__section" id="how">
        <h2>How a complaint travels</h2>
        <p>Three moves, and none of them need a follow-up email.</p>
        <div className="steps-grid">
          {STEPS.map((step) => (
            <article key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band" id="start">
        <div>
          <h2>Something needs fixing?</h2>
          <p>Create an account and file it in under two minutes.</p>
        </div>
        <Link to={user ? home : "/register"} className="btn btn--primary">
          Get started
          <Icon name="arrowRight" size={17} />
        </Link>
      </section>

      <footer className="landing__footer">
        <span>ResolveX - report, track, resolve, together.</span>
        <span>{new Date().getFullYear()} ResolveX</span>
      </footer>
    </div>
  );
}
