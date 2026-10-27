import { CSSProperties, useEffect, useRef } from "react";
import { useAuroraPointer } from "../hooks/useAuroraPointer";
import { useJourney } from "../app/store";
import s from "./ProfileAtmosphere.module.css";
const shapes = [
  "M-180 170 C220 0 410 480 800 240 S1300 20 1790 300 L1790 580 C1250 310 1130 610 780 450 S240 210 -180 410 Z",
  "M-180 260 C180 520 560 10 850 240 S1370 500 1790 170 L1790 440 C1310 680 1160 380 820 420 S170 670 -180 490 Z",
  "M-180 170 C220 0 410 480 800 240 S1300 20 1790 300 L1790 580 C1250 310 1130 610 780 450 S240 210 -180 410 Z",
];
/** Slow aurora motion is time-based; the center stays dark enough to read. */
export default function ProfileAtmosphere() {
  const root = useRef<HTMLDivElement>(null);
  const pointer = useAuroraPointer();
  const blend = useJourney((v) => v.profileBlend),
    progress = useJourney((v) => v.profileProgress),
    reduced = useJourney((v) => v.reducedMotion);
  useEffect(() => {
    if (reduced || blend <= 0) return;
    let frame = 0,
      x = 0,
      y = 0,
      previous = performance.now();
    const tick = (now: number) => {
      const damping = 1 - Math.exp(-Math.min(now - previous, 100) / 350);
      previous = now;
      x += (pointer.current.x - x) * damping;
      y += (pointer.current.y - y) * damping;
      root.current?.style.setProperty("--aurora-x", `${x * 4}%`);
      root.current?.style.setProperty("--aurora-y", `${y * 3}%`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, blend > 0, pointer]);
  return (
    <div
      ref={root}
      className={s.atmosphere}
      data-profile-atmosphere
      aria-hidden="true"
      style={{ opacity: blend, "--travel": progress } as CSSProperties}
    >
      <div className={s.light} />
      <svg
        className={s.aurora}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="profile-aurora" x1="0" y1="1" x2="0" y2="0">
            <stop stopColor="#37d398" stopOpacity="0" />
            <stop offset=".35" stopColor="#37d398" stopOpacity=".6" />
            <stop offset=".6" stopColor="#4eb9c9" stopOpacity=".45" />
            <stop offset="1" stopColor="#8675cc" stopOpacity="0" />
          </linearGradient>
          <filter id="aurora-soft">
            <feGaussianBlur stdDeviation="11" />
          </filter>
        </defs>
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={shapes[0]}
            fill="url(#profile-aurora)"
            filter="url(#aurora-soft)"
            opacity={1 - i * 0.25}
            transform={`translate(${i * 260 - 200},${i * -90}) scale(${1 + i * 0.12})`}
          >
            {!reduced && (
              <animate
                attributeName="d"
                values={shapes.join(";")}
                dur={`${15 + i * 6}s`}
                repeatCount="indefinite"
              />
            )}
          </path>
        ))}
      </svg>
      <svg
        className={s.stars}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        {Array.from({ length: 55 }, (_, i) => (
          <circle
            key={i}
            cx={(i * 317.39) % 1600}
            cy={(i * 211.13) % 1000}
            r={i % 7 === 0 ? 1.4 : 0.7}
            fill="#b9d8d1"
            opacity={i % 7 === 0 ? 0.35 : 0.14}
          />
        ))}
      </svg>
      <div className={s.depth} />
    </div>
  );
}
