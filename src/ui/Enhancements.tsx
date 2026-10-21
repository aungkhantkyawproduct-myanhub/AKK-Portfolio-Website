import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { content as c } from "../content/content";
import { navigateItem } from "../hooks/useJourney";
import { updateAmbient, suspendAmbient, resumeAmbient } from "../audio/ambient";
import { useJourney } from "../app/store";
import s from "./UI.module.css";
export function Menu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={s.menuDialog}
      onCancel={onClose}
      aria-label={c.ui.menu}
    >
      <motion.div
        className={s.menu}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      >
        <button className={s.close} onClick={onClose} aria-label={c.ui.close}>
          ×
        </button>
        {c.ui.nav.map((n, i) => (
          <motion.button
            whileHover={{ x: 15 }}
            key={n}
            onClick={() => {
              onClose();
              navigateItem(i);
            }}
          >
            <small>0{i + 1}</small>
            {n}
          </motion.button>
        ))}
        <p>{c.tagline}</p>
      </motion.div>
    </dialog>
  );
}
export function Enhancements() {
  const cursor = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const move = (e: PointerEvent) => {
      const el = cursor.current;
      if (!el) return;
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.opacity = "1";
      const interactive = !!(e.target as HTMLElement).closest(
        "a,button,summary",
      );
      el.style.width = interactive ? "35px" : "20px";
      el.style.height = interactive ? "35px" : "20px";
      el.style.borderRadius = interactive ? "2px 65% 2px 65%" : "50%";
    };
    const show = (e: Event) => {
      setToast((e as CustomEvent).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(""), 3000);
    };
    const visibility = () =>
      document.hidden ? suspendAmbient() : resumeAmbient();
    window.addEventListener("pointermove", move);
    window.addEventListener("toast", show);
    document.addEventListener("visibilitychange", visibility);
    const unsubscribe = useJourney.subscribe((s) =>
      updateAmbient(s.scrollProgress),
    );
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("toast", show);
      document.removeEventListener("visibilitychange", visibility);
      unsubscribe();
    };
  }, []);
  return (
    <>
      <div
        ref={cursor}
        className={s.cursor}
        style={{ opacity: 0 }}
        aria-hidden="true"
      />
      <AnimatePresence>
        {toast && (
          <motion.div
            className={s.toast}
            role="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
