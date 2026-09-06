import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";
import ThreeDScene from "../components/ThreeDScene";

export default function Home() {
  return (
    <div className="rx-public">
      <ThreeDScene variant="hero" />
      <header className="rx-public-nav">
        <Link to="/" className="rx-public-brand">
          <span className="rx-public-mark">R</span>
          <span>Resolve<span>X</span></span>
        </Link>
        <nav className="rx-public-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
        </nav>
        <div className="rx-public-actions">
          <Link to="/login" className="rx-public-signin">Sign in</Link>
          <Link to="/register" className="rx-gradient-btn">Get started <b>→</b></Link>
        </div>
      </header>

      <main>
        <section className="rx-hero">
          <div className="rx-hero-copy">
            <div className="rx-launch-pill"><span>✦</span> SMART COMPLAINT RESOLUTION</div>
            <h1>Report clearly.<br /><span>Resolve faster.</span></h1>
            <p>ResolveX gives students and teams one focused workspace to report issues, track progress and move every complaint toward a clear resolution.</p>
            <div className="rx-hero-actions">
              <Link to="/register" className="rx-gradient-btn large">Start a complaint <b>→</b></Link>
              <Link to="/admin-login" className="rx-dark-outline">Administrator access <b>↗</b></Link>
            </div>
            <div className="rx-trust-row"><span>✓ Secure accounts</span><span>✓ Live status</span><span>✓ Optional evidence</span></div>
          </div>

          <div className="rx-hero-visual">
            <div className="rx-glow rx-glow-one" />
            <div className="rx-glow rx-glow-two" />
            <div className="rx-orbit orbit-one" /><div className="rx-orbit orbit-two" />
            <div className="rx-hero-card">
              <div className="rx-hero-card-top"><div className="rx-mini-brand"><span>R</span> RESOLVEX</div><span className="rx-live">● LIVE</span></div>
              <div className="rx-preview-title">Resolution overview</div>
              <div className="rx-preview-stats">
                <div><small>Total reports</small><strong>128</strong><em>+12%</em></div>
                <div><small>Resolved</small><strong>94</strong><em className="mint">+18%</em></div>
                <div><small>Active</small><strong>24</strong><em className="blue">Live</em></div>
              </div>
              <div className="rx-preview-chart"><span /><span /><span /><span /><span /><span /><span /><span /></div>
              <div className="rx-preview-list"><div><b>Water leakage · Block B</b><span className="rx-status resolved">Resolved</span></div><div><b>Hostel maintenance</b><span className="rx-status assigned">Assigned</span></div><div><b>Network connectivity</b><span className="rx-status pending">Pending</span></div></div>
            </div>
            <img className="rx-hero-layer" src={heroImage} alt="ResolveX platform visual" />
            <div className="rx-float-card float-resolved"><small>RESOLVED TODAY</small><strong>24</strong><span>complaints closed</span></div>
            <div className="rx-float-card float-team"><span className="rx-green-dot" /><div><strong>Team assigned</strong><small>4 members handling an issue</small></div></div>
          </div>
        </section>

        <section id="features" className="rx-feature-strip">
          <div><span className="rx-feature-icon purple">✦</span><div><b>Clear reporting</b><p>Describe the issue without unnecessary steps.</p></div></div>
          <div><span className="rx-feature-icon cyan">⌁</span><div><b>Live tracking</b><p>See pending, assigned and resolved states.</p></div></div>
          <div><span className="rx-feature-icon pink">◈</span><div><b>Team action</b><p>Admins can assign owners and update progress.</p></div></div>
          <div><span className="rx-feature-icon green">✓</span><div><b>Evidence ready</b><p>Attach an image when visual proof matters.</p></div></div>
        </section>

        <section id="how" className="rx-public-section">
          <div className="rx-section-heading"><span>WORKFLOW / 01</span><h2>From report to resolution.</h2><p>A simple process designed around the person who needs something fixed.</p></div>
          <div className="rx-step-grid"><article><span>01</span><h3>Submit</h3><p>Add the title, details, category and priority. Attach an optional image.</p></article><article><span>02</span><h3>Assign</h3><p>Administrators route the complaint to the right members for action.</p></article><article><span>03</span><h3>Resolve</h3><p>Follow the status until the issue is completed and closed.</p></article></div>
        </section>

        <section id="about" className="rx-bottom-cta"><div><span>RESOLVEX PLATFORM</span><h2>Make every issue<br /><em>worth resolving.</em></h2></div><Link to="/register" className="rx-gradient-btn large">Create account <b>→</b></Link></section>
      </main>
      <footer className="rx-footer"><span>ResolveX</span><span>Complaint resolution workspace</span><span>© 2026</span></footer>
    </div>
  );
}
