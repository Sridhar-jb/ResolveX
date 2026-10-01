import Icon from "../lib/icons";

/** The ResolveX mascot, drawn rather than shipped as an image asset. */
export function Mascot({ size = 190 }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="ResolveX assistant">
      <defs>
        <linearGradient id="mascot-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <radialGradient id="mascot-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="86" fill="url(#mascot-glow)" />

      {/* antenna */}
      <line x1="100" y1="34" x2="100" y2="52" stroke="url(#mascot-body)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="30" r="7" fill="#5eead4" />

      {/* head */}
      <rect x="48" y="50" width="104" height="80" rx="34" fill="url(#mascot-body)" opacity="0.92" />
      <rect x="58" y="62" width="84" height="56" rx="26" fill="#070b1e" opacity="0.88" />
      <ellipse cx="82" cy="90" rx="9" ry="11" fill="#5eead4" />
      <ellipse cx="118" cy="90" rx="9" ry="11" fill="#5eead4" />
      <path d="M88 106q12 9 24 0" stroke="#5eead4" strokeWidth="3.4" fill="none" strokeLinecap="round" />

      {/* ears */}
      <rect x="34" y="74" width="12" height="34" rx="6" fill="url(#mascot-body)" />
      <rect x="154" y="74" width="12" height="34" rx="6" fill="url(#mascot-body)" />

      {/* body */}
      <rect x="64" y="134" width="72" height="38" rx="18" fill="url(#mascot-body)" opacity="0.78" />
      <rect x="86" y="146" width="28" height="6" rx="3" fill="#070b1e" opacity="0.6" />
    </svg>
  );
}

/**
 * The wide gradient banner at the top of each dashboard.
 * `tags` renders the floating capability chips from the reference design.
 */
export default function Banner({ eyebrow, title, highlight, description, quote, quoteBy, tags = [] }) {
  return (
    <section className="banner">
      <div>
        {eyebrow ? <p className="banner__eyebrow">{eyebrow}</p> : null}
        <h1>
          {title} {highlight ? <em>{highlight}</em> : null}
        </h1>
        {description ? <p>{description}</p> : null}
        {quote ? (
          <p className="banner__quote">
            {quote}
            {quoteBy ? <span className="faint"> — {quoteBy}</span> : null}
          </p>
        ) : null}
      </div>

      <div className="row-wrap" style={{ justifyContent: "flex-end", gap: 20 }}>
        <div className="banner__bot hide-sm">
          <Mascot />
        </div>
        {tags.length ? (
          <div className="banner__tags">
            {tags.map((tag) => (
              <span key={tag.label} className="banner__tag">
                <Icon name={tag.icon} size={17} />
                {tag.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
