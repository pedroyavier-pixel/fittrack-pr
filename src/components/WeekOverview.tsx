import type {WorkoutDay} from '../data/training';
const names=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
export function WeekOverview({plans,currentDay}:{plans:WorkoutDay[];currentDay:number}){
 const active=plans.filter(plan=>plan.type!=='rest');
 if(!active.some(plan=>plan.focus))return null;
 return <details className="card week-overview"><summary>Tu semana · cada sesión tiene un propósito</summary><p className="muted small">La distribución se mantiene entre semanas para poder comparar tus registros. Ajusta el esfuerzo a tu recuperación.</p><div className="stack">{[1,2,3,4,5,6,0].map(day=>{
  const plan=plans.find(item=>item.day===day);if(!plan)return null;
  return <article key={day} className={`week-day-purpose ${day===currentDay?'selected':''}`}><div className="section-title"><strong>{names[day]}{day===currentDay?' · día consultado':''}</strong><span className="badge">{plan.type==='rest'?'Descanso':plan.type==='strength'?'Fuerza / circuito':plan.type==='recovery'?'Recuperación activa':'Cardio'}</span></div><h3>{plan.title}</h3>{plan.focus&&plan.focus!==plan.title&&<p>{plan.focus}</p>}{plan.type!=="rest"&&plan.rationale&&<p className="muted small">{plan.rationale}</p>}</article>;
 })}</div></details>;
}
