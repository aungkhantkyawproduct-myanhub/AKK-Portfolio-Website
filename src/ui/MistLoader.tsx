import { useEffect, useRef, useState } from "react";
import { useJourney } from "../app/store";
import { content as c } from "../content/content";
import BrandMark from "./BrandMark";
import s from "./MistLoader.module.css";
const branches: string[] = [];
function branch(
  x: number,
  y: number,
  length: number,
  angle: number,
  depth: number,
) {
  const ex = x + Math.cos(angle) * length,
    ey = y + Math.sin(angle) * length;
  branches.push(
    `M${x},${y} Q${x + Math.cos(angle + 0.15) * length * 0.55},${y + Math.sin(angle) * length * 0.55} ${ex},${ey}`,
  );
  if (depth > 0) {
    branch(ex, ey, length * 0.72, angle - 0.42, depth - 1);
    branch(ex, ey, length * 0.69, angle + 0.5, depth - 1);
  }
}
branch(500, 640, 170, -Math.PI / 2, 7);
export default function MistLoader({
  ready,
  onComplete,
}: {
  ready: boolean;
  onComplete: () => void;
}) {
  const reduced = useJourney((s) => s.reducedMotion);
  const [progress, setProgress] = useState(0),
    [clearing, setClearing] = useState(false);
  const start = useRef(performance.now());
  useEffect(() => {
    performance.mark("portfolio-loader-start");
    let frame = 0;
    const countDuration = reduced ? 200 : 1000,
      totalDuration = reduced ? 400 : 1900;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start.current) / countDuration));
      setProgress(Math.round((1 - Math.pow(1 - t, 2)) * 100));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const clear = setTimeout(() => {
      setProgress(100);
      setClearing(true);
      document.documentElement.dataset.heroRevealed = "true";
      window.dispatchEvent(new Event("hero-reveal"));
    }, countDuration);
    const finish = setTimeout(() => {
      performance.mark("portfolio-loader-finish");
      onComplete();
    }, totalDuration);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(clear);
      clearTimeout(finish);
      document.body.style.overflow = before;
    };
  }, [reduced, onComplete]);
  return (
    <div
      className={`${s.loader} ${clearing ? s.clearing : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`${c.ui.loading} ${progress}%`}
      data-phase={clearing ? "revealing" : "loading"}
      data-assets-ready={ready}
    >
      <div className={s.landscape} />
      <svg className={s.silhouette} viewBox="0 0 1000 700" aria-hidden="true">
        {branches.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#01070b"
            strokeWidth={Math.max(1.5, 21 / Math.sqrt(i + 1))}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <svg className={s.filters} aria-hidden="true">
        <filter id="mist-volume" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".008 .017"
            numOctaves="3"
            seed="11"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.5 0 0 0 -.28"
            result="density"
          />
          <feComposite in="SourceGraphic" in2="density" operator="in" />
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </svg>
      <div className={`${s.mist} ${s.far}`} />
      <div className={`${s.mist} ${s.middle}`} />
      <div className={`${s.mist} ${s.near}`} />
      <div className={s.veil} />
      <div className={s.copy}>
        <BrandMark />
        <p>{c.tagline}</p>
        <div className={s.orbit}>
          <svg viewBox="0 0 140 140" aria-hidden="true">
            <defs>
              <linearGradient id="orbit-light">
                <stop stopColor="#71c8c1" />
                <stop offset=".65" stopColor="#eee1b8" />
                <stop offset="1" stopColor="#fff8da" />
              </linearGradient>
            </defs>
            <circle className={s.track} cx="70" cy="70" r="57" />
            <circle className={s.ticks} cx="70" cy="70" r="66" />
            <circle
              className={s.fill}
              cx="70"
              cy="70"
              r="57"

              style={{ strokeDashoffset: 358.142 * (1 - progress / 100) }}
            />
            <path
              className={s.seed}
              d="M70 48C51 59 53 83 70 91C87 83 89 59 70 48Z M70 58V83"
            />
          </svg>
          <span>
            {String(progress).padStart(2, "0")}
            <sup>%</sup>
          </span>
        </div>
        <small>{c.ui.loading}</small>
      </div>
    </div>
  );
}
