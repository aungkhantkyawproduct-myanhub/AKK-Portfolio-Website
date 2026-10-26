import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { content as c } from "../content/content";
import { useJourney } from "./store";
import { useScrollJourney, navigate, navigateItem } from "../hooks/useJourney";
import ProfileAtmosphere from "../ui/ProfileAtmosphere";
import Profile from "../chapters/Profile";
import BrandMark from "../ui/BrandMark";
import SoundIcon from "../ui/SoundIcon";
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
        {innerWidth < 600 ? c.ui.heroMobileHint : c.ui.heroHint}
      </div>
    </>
  );
}
export default function App() {
  useScrollJourney();
  const chapter = useJourney((v) => v.activeChapter);
  const sound = useJourney((v) => v.soundOn);
  const profile = useJourney((v) => v.profileActive);
  const profileBlend = useJourney((v) => v.profileBlend);
  const reduced = useJourney((v) => v.reducedMotion);
  const [loaded, setLoaded] = useState(false);
  const [worldStarted, setWorldStarted] = useState(false);
  const [worldPainted, setWorldPainted] = useState(false);
  useEffect(() => {
    const painted = () => setWorldPainted(true);
    window.addEventListener("world-painted", painted);
    return () => window.removeEventListener("world-painted", painted);
  }, []);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(() => scrollY > 16);
  useEffect(() => {
    const update = () => setScrolled(scrollY > 16);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const [assetReady, setAssetReady] = useState(false);
  const finishLoading = useCallback(() => {
    setLoaded(true);
    setTimeout(() => setWorldStarted(true), 60);
    document.documentElement.dataset.journeyReady = "true";
    window.dispatchEvent(new Event("journey-ready"));
  }, []);
  const [failed, setFailed] = useState(() => !supportsWebGL());
  const linear = reduced || failed;
  const overlay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ready = () => {
      setAssetReady(true);
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
      <div inert={!loaded ? "" : undefined}>
        <DetailPanel />
        <Menu open={menu} onClose={() => setMenu(false)} />
        <Enhancements />
        <a className={s.skip} href="#story">
          {c.ui.skip}
        </a>
        <div className={s.canvas}>
          {linear ? (
            <Fallback />
          ) : worldStarted ? (
            <CanvasBoundary onFailure={() => setFailed(true)}>
              <Suspense fallback={null}>
                <World />
              </Suspense>
            </CanvasBoundary>
          ) : null}
          {!linear && (
            <div
              className={s.heroPoster}
              data-hidden={worldPainted && assetReady}
              aria-hidden="true"
            />
          )}
          <ProfileAtmosphere />
        </div>
        <header
          className={s.header}
          data-profile={profile}
          data-scrolled={scrolled}
        >
          <button
            className={s.logo}
            aria-label={c.ui.wordmark}
            onClick={() => navigate(0)}
          >
            <BrandMark />
          </button>
          <nav>
            {c.ui.nav.map((n, i) => (
              <button key={n} aria-label={n} onClick={() => navigateItem(i)}>
                {n}
              </button>
            ))}
          </nav>
          <div className={s.actions}>
            <button
              className={s.sound}
              onClick={() => void toggleAmbient()}
              aria-label={sound ? c.ui.soundOn : c.ui.soundOff}
              title={sound ? c.ui.soundOn : c.ui.soundOff}
              aria-pressed={sound}
            >
              <SoundIcon on={sound} />
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
            data-focus={chapter > 0}
            style={{ opacity: !linear ? 1 - Math.min(1, profileBlend * 2) : 1 }}
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
                    <h1>{c.name}</h1>
                    <div className={s.identity}>{c.heroRole}</div>
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
                    {i !== 7 && <p>{ch.line}</p>}
                    <ChapterBody chapter={i} />
                  </>
                )}
              </section>
            ))}
          </div>
        </main>
        <Profile />
        {!linear && <Rail />}
      </div>
      {!loaded && <MistLoader ready={assetReady} onComplete={finishLoading} />}
    </>
  );
}
