import { memo, useEffect, useRef } from "react";
import { observeText, textSelector } from "../ui/textMotion";
import { content as c } from "../content/content";
import { useJourney } from "../app/store";
import { navigate, continueProfile } from "../hooks/useJourney";
import s from "./Profile.module.css";
function Profile() {
  const root = useRef<HTMLElement>(null),
    reduced = useJourney((v) => v.reducedMotion);
  useEffect(() => {
    if (reduced || !root.current) return;
    return observeText(root.current, textSelector + ", [data-profile-label]");
  }, [reduced]);
  return (
    <section
      ref={root}
      id="profile"
      className={s.profile}
      aria-labelledby="profile-title"
    >
      <div className={s.intro} data-reveal>
        <span className={s.label} data-profile-label>
          {c.profile.eyebrow}
        </span>
        <h2 id="profile-title">{c.profile.title}</h2>
        <p>{c.profile.introduction}</p>
        <button
          className={s.continue}
          onClick={continueProfile}
          aria-label={c.profile.continue}
        >
          <span className={s.continueCircle} aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 5v22M8 19l8 8 8-8" />
            </svg>
          </span>
          <span className={s.continueLabel}>{c.profile.continue}</span>
        </button>
      </div>
      <section
        id="profile-about"
        className={s.about}
        data-reveal
        aria-labelledby="about-title"
      >
        <h3 id="about-title" className={s.label}>
          {c.profile.about}
        </h3>
        <p>{c.summary}</p>
      </section>
      <div className={s.results} data-reveal aria-label={c.profile.results}>
        {c.results.map(([value, label]) => (
          <div key={label} data-text-reveal>
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
              <span className={s.label} data-profile-label>
                0{i + 1}
              </span>
              <span className={s.year} data-profile-label>
                {job.dates.match(/\d{4}/)?.[0]}
              </span>
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
              <span className={s.label} data-profile-label>
                0{i + 1}
              </span>
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
        <span className={s.label} data-profile-label>
          {c.status}
        </span>
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
