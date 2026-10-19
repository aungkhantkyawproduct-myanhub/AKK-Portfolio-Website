import { content as c } from '../content/content';
import s from './Chapters.module.css';
export default function ChapterBody({chapter}:{chapter:number}){return chapter===1?<div className={s.body}><p className={s.summary}>{c.summary}</p><div className={s.education}>{c.education.map((e,i)=><div key={e}><span>0{i+1}</span>{e}</div>)}</div></div>:null;}
