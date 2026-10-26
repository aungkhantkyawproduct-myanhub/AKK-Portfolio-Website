import { lazy, Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { content as c } from "../content/content";
import { useJourney } from "./store";
import { useScrollJourney, navigate, navigateItem } from "../hooks/useJourney";
import Profile from "../chapters/Profile";
import MistLoader from "../ui/MistLoader";
import { boundaries } from "../canvas/cameraPath";
import s from "./App.module.css";
import ChapterBody from "../chapters/ChapterBody";
import DetailPanel from "../ui/DetailPanel";
import { Menu, Enhancements } from "../ui/Enhancements";
import { toggleAmbient } from "../audio/ambient";
import { CanvasBoundary, Fallback, supportsWebGL } from "../ui/Fallback";
const World = lazy(() => import("../canvas/World"));
function Rail() {
  const p = useJourney((v) => v.scrollProgress);
  const chapter = useJourney((v) => v.activeChapter);
  const profile = useJourney((v) => v.profileActive);
  if (profile) return null;
  return (
    <>
      <aside className={s.rail} aria-label="Journey chapters">
        <span>{c.chapters[chapter].stage}</span>
        <div className={s.track}>
          <i style={{ height: `${p * 100}%` }} />
          {boundaries.slice(0, 8).map((v, i) => (
            <button
              aria-label={c.chapters[i].stage}
              aria-current={chapter === i ? "step" : undefined}
              key={v}
              style={{ top: `${(i / 7) * 100}%` }}
              onClick={() => navigate(v + 0.001)}
            />
          ))}
        </div>
        <small>
          {p < 0.25 ? "◈" : p < 0.7 ? "♧" : "♧"}{" "}
          {String(chapter + 1).padStart(2, "0")}
        </small>
      </aside>
      <div className={s.hint} style={{ opacity: p < 0.025 ? 1 : 0 }}>
        <span>↓</span>
        {innerWidth < 600 ? c.ui.mobileHint : c.ui.hint}
      </div>
    </>
  );
}
export default function App() {
  useScrollJourney();
  const chapter = useJourney((v) => v.activeChapter);
  const sound = useJourney((v) => v.soundOn);
  const profile = useJourney((v) => v.profileActive);
  const reduced = useJourney((v) => v.reducedMotion);
  const [loaded, setLoaded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(() => !supportsWebGL());
  const linear = reduced || failed;
  const overlay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let reveal: ReturnType<typeof setTimeout>;
    const ready = () => {
      setProgress(100);
      reveal = setTimeout(() => setLoaded(true), 2400);
    };
    const fail = () => {
      setFailed(true);
      ready();
    };
    window.addEventListener("world-ready", ready);
    window.addEventListener("webgl-failed", fail);
    const timer = setTimeout(ready, 8000);
    if (linear) ready();
    document.documentElement.dataset.linear = String(linear);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => useJourney.setState({ reducedMotion: media.matches });
    media.addEventListener("change", change);
    return () => {
      clearTimeout(timer);
      clearTimeout(reveal);
      window.removeEventListener("world-ready", ready);
      window.removeEventListener("webgl-failed", fail);
      media.removeEventListener("change", change);
    };
  }, [linear]);
  useEffect(() => {
    const section = overlay.current?.children[chapter];
    if (!section || reduced) return;
    const animation = gsap.fromTo(
      section,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        clearProps: "transform",
      },
    );
    return () => {
      animation.kill();
    };
  }, [chapter, reduced]);
  return (
    <>
      <DetailPanel />
      <Menu open={menu} onClose={() => setMenu(false)} />
      <Enhancements />
      <a className={s.skip} href="#story">
        {c.ui.skip}
      </a>
      <div className={s.canvas}>
        {linear ? (
          <Fallback />
        ) : (
          <CanvasBoundary onFailure={() => setFailed(true)}>
            <Suspense fallback={null}>
              <World />
            </Suspense>
          </CanvasBoundary>
        )}
      </div>
      <header className={s.header} data-profile={profile}>
        <button className={s.logo} onClick={() => navigate(0)}>
          {c.ui.wordmark}
          <span>✳</span>
        </button>
        <nav>
          {c.ui.nav.map((n, i) => (
            <button key={n} onClick={() => navigateItem(i)}>
              {n}
            </button>
          ))}
        </nav>
        <div className={s.actions}>
          <button
            className={s.sound}
            onClick={() => void toggleAmbient()}
            aria-pressed={sound}
          >
            {sound ? c.ui.soundOn : c.ui.soundOff} <span>▥</span>
          </button>
          <button
            className={s.menuButton}
            onClick={() => setMenu(true)}
            aria-expanded={menu}
          >
            {c.ui.menu} ☰
          </button>
        </div>
      </header>
      <main
        id="story"
        className={`${s.scroll} ${linear ? s.linear : ""}`}
        tabIndex={-1}
      >
        <div
          ref={overlay}
          className={s.overlay}
          style={{ opacity: profile && !linear ? 0 : 1 }}
          inert={profile && !linear ? "" : undefined}
        >
          {c.chapters.map((ch, i) => (
            <section
              key={ch.stage}
              data-chapter={i}
              data-lenis-prevent
              className={`${s.chapter} ${i === 0 ? s.hero : ""} ${i % 2 === 1 ? s.right : ""}`}
              aria-hidden={linear ? undefined : chapter !== i}
              inert={!linear && chapter !== i ? "" : undefined}
              style={{
                visibility: linear || chapter === i ? "visible" : "hidden",
              }}
            >
              {i !== 0 && <div className={s.eyebrow}>{ch.eyebrow}</div>}
              {i === 0 ? (
                <>
                  <div className={s.identity}>{c.heroRole}</div>
                  <h1 aria-label={c.name}>
                    {c.name.split(" ").map((n, j) => (
                      <span key={n} aria-hidden="true">
                        {n.split("").map((char, k) => (
                          <span
                            className={s.char}
                            key={k}
                            style={{
                              animationDelay: `${0.3 + j * 0.15 + k * 0.035}s`,
                            }}
                          >
                            {char}
                          </span>
                        ))}
                      </span>
                    ))}
                  </h1>
                  <p className={s.tagline}>{c.tagline}</p>
                  <div className={s.heroBottom}>
                    <span>01 — 08</span>
                    <span>
                      {c.location}
                      <br />
                      <i /> {c.status}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2>{ch.title}</h2>
                  <p>{ch.line}</p>
                  <ChapterBody chapter={i} />
                </>
              )}
            </section>
          ))}
        </div>
      </main>
      <Profile />
      {!linear && <Rail />}
      {!loaded && <MistLoader progress={progress} />}
    </>
  );
}
