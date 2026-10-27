import { useEffect, useRef } from "react";
import { useJourney } from "../app/store";
import s from "./AuroraCursor.module.css";

type Point = { x: number; y: number };
/** Local light wakes in the pointer's path, curls, and dissipates after release. */
export default function AuroraCursor() {
  const root = useRef<SVGSVGElement>(null);
  const reduced = useJourney((state) => state.reducedMotion);
  useEffect(() => {
    if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    const svg = root.current!;
    const ribbons = Array.from(
      svg.querySelectorAll<SVGPathElement>("[data-wisp]"),
    );
    const glow = svg.querySelector<SVGPathElement>("[data-glow]")!;
    const gradient =
      svg.querySelector<SVGLinearGradientElement>("#cursor-spectrum")!;
    const trail: Point[] = Array.from({ length: 30 }, () => ({ x: 0, y: 0 }));
    let frame = 0,
      last = 0,
      moved = -10000,
      speed = 0,
      initialized = false;
    const pointer = { x: 0, y: 0 };
    const path = (points: Point[]) =>
      points
        .map(
          (point, i) =>
            `${i ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
        )
        .join(" ");
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const life = Math.max(0, 1 - Math.max(0, now - moved - 100) / 1450);
      svg.style.opacity = `${life * 0.78}`;
      if (life === 0 || document.hidden) {
        frame = 0;
        return;
      }
      speed *= Math.exp(-dt * 2.2);
      trail.forEach((point, i) => {
        const previous = i ? trail[i - 1] : pointer;
        const follow = 1 - Math.exp(-dt * (i ? 13 : 45));
        point.x += (previous.x - point.x) * follow;
        point.y += (previous.y - point.y) * follow;
      });
      const t = now * 0.001;
      const center: Point[] = [];
      ribbons.forEach((ribbon, strand) => {
        const left: Point[] = [],
          right: Point[] = [];
        trail.forEach((point, i) => {
          const u = i / (trail.length - 1),
            previous = trail[Math.max(0, i - 1)];
          const next = trail[Math.min(trail.length - 1, i + 1)];
          const dx = next.x - previous.x,
            dy = next.y - previous.y;
          const length = Math.max(1, Math.hypot(dx, dy));
          const nx = -dy / length,
            ny = dx / length;
          const envelope = Math.sin(u * Math.PI) ** 0.65;
          const curl =
            Math.sin(u * 13 - t * 2 + strand * 2.1) *
            envelope *
            (16 + strand * 8);
          const width =
            envelope *
            (20 + Math.min(speed, 90) * 0.65) *
            (1 - u * 0.6) *
            (1 - strand * 0.2);
          const x = point.x + nx * curl + Math.cos(u * 8 + t) * envelope * 9;
          const y =
            point.y + ny * curl + Math.sin(u * 9 - t * 1.2) * envelope * 9;
          left.push({ x: x + nx * width, y: y + ny * width });
          right.push({ x: x - nx * width, y: y - ny * width });
          if (strand === 0) center.push({ x, y });
        });
        ribbon.setAttribute(
          "d",
          `${path(left)} ${path(right.reverse()).replace("M", "L")} Z`,
        );
      });
      glow.setAttribute("d", path(center));
      const tail = trail[trail.length - 1];
      gradient.setAttribute("x1", `${tail.x}`);
      gradient.setAttribute("y1", `${tail.y}`);
      gradient.setAttribute("x2", `${pointer.x + 1}`);
      gradient.setAttribute("y2", `${pointer.y + 1}`);
      frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const distance = Math.hypot(
        event.clientX - pointer.x,
        event.clientY - pointer.y,
      );
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!initialized || performance.now() - moved > 1800) {
        trail.forEach((point) => {
          point.x = pointer.x;
          point.y = pointer.y;
        });
        initialized = true;
      }
      speed = Math.min(110, speed + distance * 0.6);
      moved = performance.now();
      if (!frame) {
        last = moved;
        frame = requestAnimationFrame(tick);
      }
    };
    const hide = () => {
      moved = -10000;
      svg.style.opacity = "0";
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", hide);
    document.documentElement.addEventListener("pointerleave", hide);
    return () => {
      cancelAnimationFrame(frame);
      svg.style.opacity = "0";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, [reduced]);
  return (
    <svg ref={root} className={s.aurora} data-aurora-cursor aria-hidden="true">
      <defs>
        <linearGradient id="cursor-spectrum" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9773e7" stopOpacity="0" />
          <stop offset=".26" stopColor="#9773e7" stopOpacity=".5" />
          <stop offset=".62" stopColor="#4bd8dc" stopOpacity=".75" />
          <stop offset=".85" stopColor="#7be2b4" stopOpacity=".6" />
          <stop offset="1" stopColor="#c8f6cf" stopOpacity="0" />
        </linearGradient>
        <filter
          id="cursor-curl"
          x="-70%"
          y="-70%"
          width="240%"
          height="240%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".014 .022"
            numOctaves="3"
            seed="8"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.4 1.2 0 0 -.8"
            result="veil"
          />
          <feComposite
            in="SourceGraphic"
            in2="veil"
            operator="in"
            result="ink"
          />
          <feDisplacementMap
            in="ink"
            in2="noise"
            scale="48"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id="cursor-halo" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>
      <path
        data-glow
        fill="none"
        stroke="url(#cursor-spectrum)"
        strokeWidth="75"
        opacity=".26"
        filter="url(#cursor-halo)"
      />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          data-wisp
          fill="url(#cursor-spectrum)"
          opacity={0.42 - i * 0.07}
          filter="url(#cursor-curl)"
        />
      ))}
    </svg>
  );
}
