import { content as c } from "../content/content";
import { navigate } from "../hooks/useJourney";
import s from "./Profile.module.css";

export default function Profile() {
  return <section id="profile" className={s.profile} aria-labelledby="profile-title">
    <div className={s.intro}>
      <span className={s.label}>{c.profile.eyebrow}</span>
      <h2 id="profile-title">{c.profile.title}</h2>
      <p>{c.profile.introduction}</p>
    </div>
    <div className={s.about}>
      <h3>{c.profile.about}</h3><p>{c.summary}</p>
    </div>
    <div className={s.results} aria-label={c.profile.results}>
      {c.results.map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}
    </div>
    <div className={s.columns}>
      <div><h3 className={s.label}>{c.profile.experience}</h3>
        {[...c.experience].reverse().map(job=><article className={s.job} key={job.company}>
          <div className={s.jobTitle}><h4>{job.company}</h4><time>{job.dates}</time></div>
          <p className={s.role}>{job.role}</p>
          <ul>{job.bullets.map(b=><li key={b}>{b}</li>)}</ul>
        </article>)}
      </div>
      <aside className={s.education}><h3 className={s.label}>{c.profile.education}</h3>
        {c.education.map((e,i)=><article key={e}><span>0{i+1}</span><p>{e}</p></article>)}
        <h3 className={s.label}>{c.ui.certifications}</h3>
        <ul>{c.certifications.map(cert=><li key={cert}>{cert}</li>)}</ul>
        <h3 className={s.label}>{c.ui.tools}</h3>
        <div className={s.tools}>{c.tools.map(tool=><span key={tool}>{tool}</span>)}</div>
      </aside>
    </div>
    <footer><a href={`mailto:${c.email}`}>{c.email} ↗</a><button onClick={()=>navigate(0)}>{c.ui.back}</button><small>{c.ui.copyright}</small></footer>
  </section>;
}
