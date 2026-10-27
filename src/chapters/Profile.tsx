import { memo, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content as c } from "../content/content";
import { useJourney } from "../app/store";
import { navigate } from "../hooks/useJourney";
import s from "./Profile.module.css";
gsap.registerPlugin(ScrollTrigger);
function Profile() {
  const root = useRef<HTMLElement>(null),
    reduced = useJourney((v) => v.reducedMotion);
  useEffect(() => {
    if (reduced || !root.current) return;
    const context = gsap.context(() => {
      root
        .current!.querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => {
          const children = Array.from(el.children);
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 96%",
              end: "top 48%",
              scrub: 0.85,
            },
          });
          // Keep text opaque throughout: movement reveals the hierarchy without
          // compromising contrast or hiding content from keyboard navigation.
          timeline.fromTo(
            children.length ? children : el,
            { y: 96 },
            { y: 0, stagger: 0.16, duration: 1.25, ease: "power3.out" },
          );
          const headings = el.matches("h2,h3,h4")
            ? [el]
            : el.querySelectorAll("h2,h3:not(#about-title),h4");
          if (headings.length)
            timeline.fromTo(
              headings,
              {
                clipPath: "inset(0% 0% 100% 0%)",
                filter: "blur(5px)",
                scale: 0.96,
              },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                filter: "blur(0px)",
                scale: 1,
                duration: 0.95,
                ease: "power2.out",
              },
              0,
            );
          const stats = el.querySelectorAll("strong");
          if (stats.length)
            timeline.fromTo(
              stats,
              { y: 26, scale: 0.88 },
              {
                y: 0,
                scale: 1,
                stagger: 0.1,
                duration: 0.9,
                ease: "power3.out",
              },
              0.15,
            );
          const circle = el.querySelectorAll("#about-title");
          if (circle.length)
            timeline.fromTo(
              circle,
              { scale: 0.84, rotate: -12 },
              { scale: 1, rotate: 0, duration: 1.1, ease: "power3.out" },
              0,
            );
          if (el.hasAttribute("data-profile-step")) {
            timeline.fromTo(
              el.querySelectorAll("li"),
              { x: 42, y: 28 },
              { x: 0, y: 0, stagger: 0.09, duration: 1, ease: "power3.out" },
              0.25,
            );
          } else if (el.querySelectorAll("article, li").length) {
            timeline.fromTo(
              el.querySelectorAll("article, li"),
              { y: 38 },
              { y: 0, stagger: 0.08, duration: 1, ease: "power2.out" },
              0.2,
            );
          }
          timeline.fromTo(
            el,
            { "--reveal": 0 },
            { "--reveal": 1, duration: 1 },
            0,
          );
        });
    }, root);
    ScrollTrigger.refresh();
    return () => context.revert();
  }, [reduced]);
  return (
    <section
      ref={root}
      id="profile"
      className={s.profile}
      aria-labelledby="profile-title"
    >
      <div className={s.intro} data-reveal>
        <span className={s.label}>{c.profile.eyebrow}</span>
        <h2 id="profile-title">{c.profile.title}</h2>
        <p>{c.profile.introduction}</p>
        <span className={s.continue} aria-hidden="true">
          ↓
        </span>
      </div>
      <section className={s.about} data-reveal aria-labelledby="about-title">
        <h3 id="about-title" className={s.label}>
          {c.profile.about}
        </h3>
        <p>{c.summary}</p>
      </section>
      <div className={s.results} data-reveal aria-label={c.profile.results}>
        {c.results.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className={s.experience} aria-labelledby="experience-title">
        <h3 id="experience-title" className={s.label} data-reveal>
          {c.profile.experience}
        </h3>
        {[...c.experience].reverse().map((job, i) => (
          <article
            className={s.job}
            key={job.company}
            data-reveal
            data-profile-step
          >
            <div className={s.era}>
              <span className={s.label}>0{i + 1}</span>
              <span className={s.year}>{job.dates.match(/\d{4}/)?.[0]}</span>
              <time>{job.dates}</time>
            </div>
            <div className={s.practice}>
              <h4>{job.company}</h4>
              <p className={s.role}>{job.role}</p>
              <ul>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
      <section
        className={s.education}
        aria-labelledby="education-title"
        data-reveal
      >
        <h3 id="education-title">{c.profile.education}</h3>
        <div>
          {c.education.map((e, i) => (
            <article key={e}>
              <span className={s.label}>0{i + 1}</span>
              <p>{e}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={s.knowledge} data-reveal>
        <div>
          <h3 className={s.label}>{c.ui.certifications}</h3>
          <ul>
            {c.certifications.map((cert) => (
              <li key={cert}>{cert}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={s.label}>{c.ui.tools}</h3>
          <p className={s.tools}>
            {c.tools.map((tool) => (
              <span key={tool}>{tool}</span>
            ))}
          </p>
        </div>
      </section>
      <footer data-reveal>
        <span className={s.label}>{c.status}</span>
        <a className={s.email} href={`mailto:${c.email}`}>
          {c.email} ↗
        </a>
        <div className={s.footerLine}>
          <a href={c.linkedin} target="_blank" rel="noreferrer">
            {c.ui.linkedin}
          </a>
          <a href={`tel:${c.phone.replaceAll(" ", "")}`}>{c.phone}</a>
          <button onClick={() => navigate(0)}>{c.ui.back}</button>
          <small>{c.ui.copyright}</small>
        </div>
      </footer>
    </section>
  );
}

export default memo(Profile);
