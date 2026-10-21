import { Component, type ReactNode } from "react";
export function supportsWebGL() {
  if (new URLSearchParams(location.search).has("fallback")) return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
export class CanvasBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function Fallback() {
  return (
    <div className="fallback-world" aria-hidden="true">
      <div className="fallback-earth" />
      <svg viewBox="0 0 400 500" fill="none">
        <defs>
          <linearGradient id="tree-stroke" x2="0" y2="1">
            <stop stopColor="#8adbd9" />
            <stop offset="1" stopColor="#dec394" />
          </linearGradient>
        </defs>
        <g stroke="url(#tree-stroke)" strokeLinecap="round">
          <path d="M200 490Q180 320 200 140" strokeWidth="10" />
          <path
            d="M198 340Q90 280 60 180M199 270Q280 235 330 120M195 220Q130 180 110 90M200 180Q240 120 220 45"
            strokeWidth="6"
          />
          <path
            d="M140 300L80 300M111 267L95 205M240 250L295 260M275 220L285 155M157 185L165 125M215 125L265 85M210 440L280 490M193 440L125 490"
            strokeWidth="3"
          />
        </g>
        {Array.from({ length: 60 }, (_, i) => {
          const a = i * 2.399,
            r = Math.sqrt(i / 60) * 150;
          return (
            <ellipse
              key={i}
              cx={200 + Math.cos(a) * r}
              cy={180 + Math.sin(a) * r * 0.8}
              rx="10"
              ry="20"
              transform={`rotate(${i * 23},${200 + Math.cos(a) * r},${180 + Math.sin(a) * r * 0.8})`}
              fill={i % 3 ? "#79bda2" : "#dec394"}
              opacity=".4"
            />
          );
        })}
      </svg>
    </div>
  );
}
