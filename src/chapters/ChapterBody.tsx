import { useEffect, useRef } from "react";
import gsap from "gsap";
import { content as c } from "../content/content";
import { useJourney } from "../app/store";
import { navigate, navigateItem } from "../hooks/useJourney";
import s from "./Chapters.module.css";
export const openDetail = (title: string, text: string, url?: string) =>
  window.dispatchEvent(
    new CustomEvent("open-detail", { detail: { title, text, url } }),
  );
function Result({ index }: { index: number }) {
  const el = useRef<HTMLElement>(null);
  const active = useJourney((v) => v.activeChapter);
  useEffect(() => {
    if (!el.current) return;
    const value = { n: 0 };
    const num = parseFloat(c.results[index][0]);
    const suffix = c.results[index][0].replace(/[\d.]/g, "");
    const tween = gsap.to(value, {
      n: num,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        if (el.current)
          el.current.textContent =
            (num % 1 ? value.n.toFixed(1) : Math.round(value.n)) + suffix;
      },
    });
    return () => {
      tween.kill();
    };
  }, [active, index]);
  return (
    <div className={s.result}>
      <b ref={el}>{c.results[index][0]}</b>
      <span>{c.results[index][1]}</span>
    </div>
  );
}
export default function ChapterBody({ chapter }: { chapter: number }) {
  if (chapter >= 1 && chapter <= 5) return <div className={s.body}>
    <p className={s.storyNote}>{c.storyNotes[chapter]}</p>
    {chapter === 5 && <div className={s.projects}>{c.projects.map((project,i)=><button key={project.name} onClick={()=>openDetail(project.name,project.description,project.url)}><i>{i===0?'✧':'◈'}</i>{project.name} ↗</button>)}</div>}
  </div>;  if (chapter === 6)
    return (
      <>
        <div className={s.skills}>
          {c.skills.map(([name, description], i) => (
            <button key={name} onClick={() => openDetail(name, description)}>
              <span>✧ {String(i + 1).padStart(2, "0")}</span>
              {name}
            </button>
          ))}
        </div>
        <div className={s.tools} aria-label={c.ui.tools}>
          {c.tools.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <details className={s.certs}>
          <summary>
            {c.ui.certifications} · {c.certifications.length}
          </summary>
          <ul>
            {c.certifications.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      </>
    );
  if (chapter === 7)
    return (
      <div className={s.contact}>
        <p className={s.status}>{c.status}</p>
        <a href={`mailto:${c.email}`}>{c.email}</a>
        <button
          onClick={async () => {
            let text: string = c.ui.copied;
            try {
              await navigator.clipboard.writeText(c.email);
            } catch {
              text = c.ui.copyFailed;
            }
            window.dispatchEvent(new CustomEvent("toast", { detail: text }));
          }}
        >
          {c.ui.copy} ⧉
        </button>
        <div className={s.contactLinks}>
          <a href={c.linkedin} target="_blank" rel="noreferrer">
            LinkedIn ↗
          </a>
          <a href={`tel:${c.phone.replaceAll(" ", "")}`}>{c.phone}</a>
        </div>
        <p>{c.location}</p>
        <button onClick={() => navigateItem(1)}>{c.profile.explore}</button>
        <div className={s.footer}>
          <span>{c.ui.copyright}</span>
          <button onClick={() => navigate(0)}>{c.ui.back}</button>
        </div>
      </div>
    );
  return null;
}

