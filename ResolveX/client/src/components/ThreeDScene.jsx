import { useEffect, useRef } from "react";

export default function ThreeDScene({ variant = "ambient", className = "" }) {
  const root = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    const el = root.current;
    const c = canvas.current;
    if (!el || !c) return;
    const ctx = c.getContext("2d");
    let raf;
    let width = 0;
    let height = 0;
    const particles = Array.from({ length: variant === "hero" ? 95 : 55 }, (_, i) => ({
      x: Math.random(), y: Math.random(), z: Math.random(), r: Math.random() * 1.8 + .4,
      speed: Math.random() * .00045 + .00012, phase: i * .7
    }));
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = el.clientWidth; height = el.clientHeight;
      c.width = width * dpr; c.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const move = (e) => {
      target.x = (e.clientX / Math.max(window.innerWidth, 1) - .5) * 2;
      target.y = (e.clientY / Math.max(window.innerHeight, 1) - .5) * 2;
    };
    const leave = () => { target.x = 0; target.y = 0; };
    const draw = (t) => {
      mouse.x += (target.x - mouse.x) * .035;
      mouse.y += (target.y - mouse.y) * .035;
      ctx.clearRect(0, 0, width, height);
      const g = ctx.createRadialGradient(width * .65, height * .35, 0, width * .65, height * .35, Math.max(width, height) * .7);
      g.addColorStop(0, "rgba(22,255,198,.09)"); g.addColorStop(.42, "rgba(0,210,255,.035)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -.02) p.y = 1.02;
        const depth = .35 + p.z * .9;
        const x = p.x * width + mouse.x * (10 + p.z * 28);
        const y = p.y * height + mouse.y * (8 + p.z * 18);
        const alpha = .12 + p.z * .48;
        ctx.beginPath(); ctx.arc(x, y, p.r * depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(85,255,213,${alpha})`; ctx.shadowBlur = 10; ctx.shadowColor = "rgba(0,255,205,.45)"; ctx.fill(); ctx.shadowBlur = 0;
      });
      el.style.setProperty("--mx", `${mouse.x * 22}px`);
      el.style.setProperty("--my", `${mouse.y * 18}px`);
      el.style.setProperty("--rx", `${mouse.y * -4}deg`);
      el.style.setProperty("--ry", `${mouse.x * 6}deg`);
      raf = requestAnimationFrame(draw);
    };
    resize(); window.addEventListener("resize", resize); window.addEventListener("pointermove", move); window.addEventListener("blur", leave); raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", move); window.removeEventListener("blur", leave); };
  }, [variant]);

  return (
    <div ref={root} className={`rx-3d-scene rx-3d-${variant} ${className}`} aria-hidden="true">
      <canvas ref={canvas} className="rx-particle-canvas" />
      <div className="rx-3d-grid" />
      <div className="rx-3d-ring ring-a" /><div className="rx-3d-ring ring-b" /><div className="rx-3d-ring ring-c" />
      <div className="rx-3d-cube cube-a"><i/><i/><i/><i/><span>R</span></div>
      <div className="rx-3d-cube cube-b"><i/><i/><i/><i/><span>X</span></div>
      {variant === "hero" && <>
        <div className="rx-3d-status-card status-pending"><b>●</b><span>Pending<small>4 complaints</small></span></div>
        <div className="rx-3d-status-card status-progress"><b>◉</b><span>In Progress<small>5 complaints</small></span></div>
        <div className="rx-3d-status-card status-resolved"><b>✓</b><span>Resolved<small>24 closed</small></span></div>
      </>}
    </div>
  );
}
