import gsap from "gsap";

// One shared timing language; text remains real, selectable DOM throughout.
export const textMotion = {
  duration: 0.85,
  stagger: 0.065,
  wordStagger: 0.035,
};
export const textSelector =
  "h1,h2,h3,h4,p,li,a,button,summary,time,[data-text-reveal]";

export function revealText(
  root: HTMLElement,
  selector = textSelector,
  delay = 0,
) {
  const candidates = root.matches(selector)
    ? [root]
    : Array.from(root.querySelectorAll<HTMLElement>(selector));
  const elements = candidates.filter(
    (el) => !candidates.some((parent) => parent !== el && parent.contains(el)),
  );
  const restored: (() => void)[] = [];
  const context = gsap.context(() => {
    const timeline = gsap.timeline({ delay });
    elements.forEach((el, index) => {
      const start = Math.min(index * textMotion.stagger, 0.45);
      if (el.matches("h1,h2,h3,h4") && el.childElementCount === 0) {
        const original = el.textContent ?? "";
        const words: HTMLSpanElement[] = [];
        el.replaceChildren(
          ...original.split(/(\s+)/).map((part) => {
            if (/^\s*$/.test(part)) return document.createTextNode(part);
            const span = document.createElement("span");
            span.textContent = part;
            span.dataset.revealWord = "";
            span.style.display = "inline-block";
            words.push(span);
            return span;
          }),
        );
        restored.push(() => {
          if (words.some((word) => word.parentElement === el))
            el.textContent = original;
        });
        timeline.fromTo(
          words,
          { opacity: 0, x: 18, y: 10, filter: "blur(5px)" },
          {
            opacity: 1,
            x: 0,
            y: 0,
            filter: "blur(0px)",
            duration: textMotion.duration,
            stagger: textMotion.wordStagger,
            ease: "power3.out",
            clearProps: "transform,opacity,filter",
          },
          start,
        );
      } else {
        timeline.fromTo(
          el,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: textMotion.duration,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          start,
        );
      }
    });
  }, root);
  return () => {
    context.revert();
    restored.forEach((restore) => restore());
  };
}

// Reveal individual reading blocks when they actually enter the viewport,
// including text reached by scrolling inside the short mobile story column.
export function observeText(root: HTMLElement, selector = textSelector) {
  const cleanups: (() => void)[] = [];
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const observer = new IntersectionObserver(
    (entries) => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        cleanups.push(
          revealText(el, selector, Math.min(order++ * textMotion.stagger, 0.3)),
        );
      }
    },
    { threshold: 0.12 },
  );
  candidates
    .filter(
      (el) =>
        !candidates.some((parent) => parent !== el && parent.contains(el)),
    )
    .forEach((el) => observer.observe(el));
  return () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
  };
}
