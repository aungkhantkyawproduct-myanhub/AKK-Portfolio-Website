import { useEffect, useRef, useState } from "react";
import { content } from "../content/content";
import s from "./UI.module.css";
export default function DetailPanel() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<{
    title: string;
    text: string;
    url?: string;
  } | null>(null);
  useEffect(() => {
    const open = (e: Event) => {
      setDetail((e as CustomEvent).detail);
      dialog.current?.showModal();
    };
    window.addEventListener("open-detail", open);
    return () => window.removeEventListener("open-detail", open);
  }, []);
  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby="detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close();
      }}
    >
      <div className={s.panel}>
        <button
          className={s.close}
          onClick={() => dialog.current?.close()}
          aria-label={content.ui.close}
        >
          ×
        </button>
        <span className={s.label}>{content.role}</span>
        <h2 id="detail-title">{detail?.title}</h2>
        {detail?.text.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {detail?.url && (
          <a
            className={s.outbound}
            href={detail.url}
            target="_blank"
            rel="noreferrer"
          >
            {content.ui.explore}
          </a>
        )}
      </div>
    </dialog>
  );
}
